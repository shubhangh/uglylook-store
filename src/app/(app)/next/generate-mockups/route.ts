import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'
import { getAvailableImageModels } from '@/lib/design-image-engine'
import { embedDesignOnProduct } from '@/lib/image-pipeline'
import { uploadImageByUrl, getBlueprint } from '@/lib/printify'

/**
 * GET /next/generate-mockups
 *
 * Returns available AI image models for the model selector.
 */
export async function GET(): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const models = await getAvailableImageModels(payload)
    return Response.json({ models })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /next/generate-mockups
 *
 * Generates mockup images:
 *   1. Printify mockups — via temp product creation (free, flat-lay)
 *   2. AI editorial — uses Printify blueprint blank photos as base,
 *      embeds the actual design onto them via FLUX.2 Pro multi-reference
 *
 * Body: {
 *   designId?: string,
 *   designUrl?: string,
 *   blueprintId: number,
 *   providerId: number,
 *   category: string,
 *   productTitle: string,
 *   colors: string[],
 *   editorialCount?: number,      — default 2
 *   skipPrintify?: boolean,
 *   skipAI?: boolean,
 * }
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const {
      designId,
      designUrl: directDesignUrl,
      blueprintId,
      providerId,
      category = 'tees',
      productTitle = 'UglyLook Product',
      editorialCount = 2,
      skipPrintify = false,
      skipAI = false,
    } = body

    // Resolve design URL and title
    let designUrl = directDesignUrl || ''
    let designTitle = ''
    if (designId && !designUrl) {
      try {
        const design = await payload.findByID({ collection: 'designs', id: designId, depth: 0 })
        designUrl = (design as any).designUrl || ''
        designTitle = (design as any).title || ''
      } catch {
        return Response.json({ error: 'Design not found' }, { status: 404 })
      }
    }

    if (!designUrl) {
      return Response.json({ error: 'No design URL available' }, { status: 400 })
    }

    const results: MockupResult = {
      printifyMockups: [],
      aiEditorialShots: [],
      errors: [],
    }

    // ── 1. Printify Mockups ──
    if (!skipPrintify && blueprintId && providerId) {
      try {
        const mockups = await generatePrintifyMockups(designUrl, blueprintId, providerId, payload)
        results.printifyMockups = mockups
      } catch (err: any) {
        results.errors.push(`Printify mockups failed: ${err.message}`)
      }
    }

    // ── 2. AI Editorial — embed design onto Printify blueprint photos ──
    if (!skipAI && editorialCount > 0 && blueprintId) {
      try {
        const shots = await generateAIEditorial(
          designUrl, designTitle, blueprintId, category, productTitle, editorialCount, payload,
        )
        results.aiEditorialShots = shots.images
        if (shots.errors.length) results.errors.push(...shots.errors)
      } catch (err: any) {
        results.errors.push(`AI editorial failed: ${err.message}`)
      }
    }

    return Response.json({
      success: true,
      ...results,
      totalMockups: results.printifyMockups.length + results.aiEditorialShots.length,
    })
  } catch (error: any) {
    console.error('Mockup generation error:', error)
    return Response.json({ error: error?.message || 'Mockup generation failed' }, { status: 500 })
  }
}

// ── Types ──

type MockupResult = {
  printifyMockups: MockupImage[]
  aiEditorialShots: MockupImage[]
  errors: string[]
}

type MockupImage = {
  mediaId: string
  url: string
  label: string
}

// ── AI Editorial Generation ──
// Uses Printify blueprint blank photos as base → embeds design via FLUX.2 Pro

async function generateAIEditorial(
  designUrl: string,
  designTitle: string,
  blueprintId: number,
  category: string,
  productTitle: string,
  count: number,
  payload: any,
): Promise<{ images: MockupImage[]; errors: string[] }> {
  const images: MockupImage[] = []
  const errors: string[] = []

  // Fetch blueprint to get blank product photos
  let blueprintImages: string[] = []
  try {
    const blueprint = await getBlueprint(blueprintId)
    blueprintImages = blueprint.images || []
  } catch (err: any) {
    errors.push(`Failed to fetch blueprint images: ${err.message}`)
    return { images, errors }
  }

  if (blueprintImages.length === 0) {
    errors.push('No blueprint images available for this product')
    return { images, errors }
  }

  const garmentType = getGarmentType(category)
  const slug = productTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-')
  const embedPrompt = buildEmbedPrompt(garmentType, category, designTitle)

  // Use up to `count` blueprint images as base, cycling if fewer available
  for (let i = 0; i < Math.min(count, 4); i++) {
    const baseImageUrl = blueprintImages[i % blueprintImages.length]

    try {
      payload.logger.info(`[Mockups] Embedding design onto blueprint photo ${i + 1}/${count}...`)

      // Embed the actual design onto the blueprint product photo
      const compositeUrl = await embedDesignOnProduct(baseImageUrl, designUrl, embedPrompt, payload)

      // Download and upload to Payload media
      const compRes = await fetch(compositeUrl)
      if (!compRes.ok) {
        errors.push(`Editorial ${i + 1}: failed to download composite`)
        continue
      }

      const compBuffer = Buffer.from(await compRes.arrayBuffer())
      const compMedia = await payload.create({
        collection: 'media',
        data: { alt: `${productTitle} — editorial ${i + 1}` },
        file: {
          data: compBuffer,
          mimetype: 'image/jpeg',
          name: `${slug}-editorial-${i + 1}.jpg`,
          size: compBuffer.length,
        },
      })

      images.push({
        mediaId: compMedia.id,
        url: (compMedia as any).url || '',
        label: `Editorial ${i + 1}`,
      })

      payload.logger.info(`[Mockups] Editorial ${i + 1}/${count} complete`)
    } catch (err: any) {
      errors.push(`Editorial ${i + 1} failed: ${err.message}`)
      payload.logger.warn(`[Mockups] Editorial ${i + 1} failed: ${err.message}`)
    }
  }

  return { images, errors }
}

// ── Printify Mockup Generation ──

async function generatePrintifyMockups(
  designUrl: string,
  blueprintId: number,
  providerId: number,
  payload: any,
): Promise<MockupImage[]> {
  const PRINTIFY_API_BASE = 'https://api.printify.com/v1'
  const token = process.env.PRINTIFY_API_TOKEN
  const shopId = process.env.PRINTIFY_SHOP_ID

  if (!token || !shopId) {
    throw new Error('PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID not set')
  }

  const printifyHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // Upload design image to Printify
  const uploadResult = await uploadImageByUrl('mockup-design.png', designUrl)

  // Fetch real variant IDs
  const variantsRes = await fetch(
    `${PRINTIFY_API_BASE}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
    { headers: printifyHeaders },
  )
  if (!variantsRes.ok) {
    throw new Error(`Failed to fetch variants: ${variantsRes.status}`)
  }
  const variantsData = await variantsRes.json()
  // Relax filter: just needs is_enabled (is_available may be false for some providers)
  const firstVariant = (variantsData.variants || []).find((v: any) => v.is_enabled !== false)
  if (!firstVariant) {
    throw new Error('No enabled variants for this blueprint/provider')
  }
  const variantId = firstVariant.id

  // Create temporary product
  const createRes = await fetch(`${PRINTIFY_API_BASE}/shops/${shopId}/products.json`, {
    method: 'POST',
    headers: printifyHeaders,
    body: JSON.stringify({
      title: `__MOCKUP_TEMP_${Date.now()}`,
      blueprint_id: blueprintId,
      print_provider_id: providerId,
      variants: [{ id: variantId, price: 100, is_enabled: true }],
      print_areas: [{
        variant_ids: [variantId],
        placeholders: [{
          position: 'front',
          images: [{ id: uploadResult.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
        }],
      }],
    }),
  })

  if (!createRes.ok) {
    const text = await createRes.text()
    payload.logger.warn(`[Mockups] Printify product creation failed: ${text}`)
    throw new Error(`Printify product creation failed: ${createRes.status}`)
  }

  const tempProduct = await createRes.json()
  const mockupImages: MockupImage[] = []

  try {
    const productImages = tempProduct.images || []
    for (let i = 0; i < Math.min(productImages.length, 4); i++) {
      const imgData = productImages[i]
      const mockupUrl = imgData.src || imgData.url
      if (!mockupUrl) continue

      try {
        const imgRes = await fetch(mockupUrl)
        if (!imgRes.ok) continue

        const buffer = Buffer.from(await imgRes.arrayBuffer())
        const media = await payload.create({
          collection: 'media',
          data: { alt: `Printify mockup ${i + 1}` },
          file: { data: buffer, mimetype: 'image/jpeg', name: `printify-mockup-${i + 1}.jpg`, size: buffer.length },
        })

        mockupImages.push({
          mediaId: media.id,
          url: (media as any).url || '',
          label: `Mockup ${i + 1}`,
        })
      } catch (err: any) {
        payload.logger.warn(`[Mockups] Failed to download Printify mockup ${i + 1}: ${err.message}`)
      }
    }
  } finally {
    // Delete temporary product
    try {
      await fetch(`${PRINTIFY_API_BASE}/shops/${shopId}/products/${tempProduct.id}.json`, {
        method: 'DELETE',
        headers: printifyHeaders,
      })
      payload.logger.info(`[Mockups] Cleaned up temp product ${tempProduct.id}`)
    } catch {
      payload.logger.warn(`[Mockups] Failed to delete temp product ${tempProduct.id}`)
    }
  }

  return mockupImages
}

// ── Helpers ──

function getGarmentType(category: string): string {
  const map: Record<string, string> = {
    hoodies: 'heavyweight hoodie',
    tees: 'cotton t-shirt',
    hats: 'snapback cap',
    totes: 'canvas tote bag',
    sweatshirts: 'crewneck sweatshirt',
  }
  return map[category] || 'garment'
}

function buildEmbedPrompt(garmentType: string, category: string, designTitle: string): string {
  const designRef = designTitle ? `The design is called "${designTitle}".` : ''

  if (category === 'hats' || category === 'caps') {
    return `Product photo editing task. Take the first reference image (a cap) and apply the design from the second reference image as an embroidered patch on the front panel. Reproduce the design EXACTLY as shown in the second reference image. The patch should look genuinely sewn on, following the cap curvature. Centered on front panel. Keep everything else unchanged. ${designRef}`
  }

  if (category === 'totes') {
    return `Product photo editing task. Take the first reference image (a tote bag) and screen-print the design from the second reference image onto the center front. Reproduce the design EXACTLY as shown. The print should look natural on the fabric. Centered, approximately 18cm wide. Keep everything else unchanged. ${designRef}`
  }

  return `Product photo editing task. Take the first reference image and screen-print the design from the second reference image onto the center chest of the ${garmentType}. Reproduce the design EXACTLY as shown in the second reference image — same shapes, same proportions, same elements. The print should look natural on matte fabric with texture visible through the ink. Centered on chest. Keep everything else unchanged — product, pose, background, lighting. ${designRef}`
}
