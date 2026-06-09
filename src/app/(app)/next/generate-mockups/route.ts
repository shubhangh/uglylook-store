import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'
import { getAvailableImageModels } from '@/lib/design-image-engine'
import { embedDesignOnProduct } from '@/lib/image-pipeline'
import { uploadImageByUrl } from '@/lib/printify'

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
      colors = [],
      editorialCount = 4,
      skipPrintify = false,
      skipAI = false,
      aiModelId,
      // E5+E6: Model persona + product context
      modelPersonaId,
      referenceImageUrl,
      productContext,
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

    // ── 2. AI Editorial — generate per-color model shots ──
    if (!skipAI && editorialCount > 0) {
      try {
        const shots = await generateAIEditorial(
          designUrl, designTitle, blueprintId, category, productTitle, colors, editorialCount, aiModelId, payload,
          referenceImageUrl, modelPersonaId, productContext,
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
// Generates per-color model shots with different angles, GenZ aesthetic

const ANGLES = ['front facing', 'slight 3/4 turn to the left', 'slight 3/4 turn to the right', 'looking down at angle with garment visible']

async function generateAIEditorial(
  designUrl: string,
  designTitle: string,
  blueprintId: number,
  category: string,
  productTitle: string,
  colors: string[],
  countPerColor: number,
  aiModelId: string | undefined,
  payload: any,
  referenceImageUrl?: string,
  modelPersonaId?: string,
  productContext?: any,
): Promise<{ images: MockupImage[]; errors: string[] }> {
  const images: MockupImage[] = []
  const errors: string[] = []

  const garmentType = getGarmentType(category)
  const slug = productTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-')
  const effectiveColors = colors.length > 0 ? colors : ['black']
  const totalImages = effectiveColors.length * countPerColor

  payload.logger.info(`[Mockups] Generating ${totalImages} AI editorial shots (${countPerColor} per color × ${effectiveColors.length} colors)`)

  let imageIndex = 0
  for (const color of effectiveColors) {
    for (let i = 0; i < countPerColor; i++) {
      const angle = ANGLES[i % ANGLES.length]
      // E5: Enrich prompt with product context
      let extraContext = ''
      if (productContext) {
        const parts: string[] = []
        if (productContext.sizes?.length) parts.push(`Available sizes: ${productContext.sizes.join(', ')}`)
        if (productContext.blueprintBrand) parts.push(`Brand: ${productContext.blueprintBrand}`)
        if (productContext.printAreaFront) parts.push(`Print area: ${productContext.printAreaFront.width}×${productContext.printAreaFront.height}px`)
        if (parts.length) extraContext = ` Product details: ${parts.join('. ')}.`
      }
      // E6: If model persona selected, resolve prompt description
      let personaPrompt = ''
      if (modelPersonaId) {
        try {
          const persona = await payload.findByID({ collection: 'ai-models' as any, id: modelPersonaId, depth: 0 })
          if ((persona as any)?.promptDescription) {
            personaPrompt = ` Model: ${(persona as any).promptDescription}.`
          }
        } catch { /* persona not found */ }
      }
      const prompt = buildModelPrompt(garmentType, color, angle, designTitle, category) + extraContext + personaPrompt

      try {
        payload.logger.info(`[Mockups] Generating ${color} shot ${i + 1}/${countPerColor} (${angle})...`)

        const compositeUrl = await embedDesignOnProduct('', designUrl, prompt, payload, aiModelId)

        const compRes = await fetch(compositeUrl)
        if (!compRes.ok) {
          errors.push(`${color} shot ${i + 1}: failed to download`)
          continue
        }

        const compBuffer = Buffer.from(await compRes.arrayBuffer())
        const compMedia = await payload.create({
          collection: 'media',
          data: { alt: `${productTitle} — ${color} ${angle}` },
          file: {
            data: compBuffer,
            mimetype: 'image/jpeg',
            name: `${slug}-${color}-${i + 1}.jpg`,
            size: compBuffer.length,
          },
        })

        images.push({
          mediaId: compMedia.id,
          url: (compMedia as any).url || '',
          label: `${color} — ${angle}`,
        })

        imageIndex++
        payload.logger.info(`[Mockups] ${imageIndex}/${totalImages} complete`)
      } catch (err: any) {
        errors.push(`${color} shot ${i + 1} failed: ${err.message}`)
        payload.logger.warn(`[Mockups] ${color} shot ${i + 1} failed: ${err.message}`)
      }
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

function buildModelPrompt(garmentType: string, color: string, angle: string, designTitle: string, category: string): string {
  const designRef = designTitle ? `The print design is called "${designTitle}".` : ''

  // Determine contrasting background color
  const bgColor = getContrastBackground(color)

  if (category === 'hats' || category === 'caps') {
    return `Editorial fashion photograph. A Gen Z model (early 20s, effortlessly cool, relaxed posture) wearing a ${color} ${garmentType} with the design from the reference image as an embroidered patch on the front panel. Model is ${angle}. Arms relaxed at sides or one hand adjusting the cap brim — NEVER arms crossed. Background: ${bgColor}, clean studio lighting. Reproduce the design EXACTLY as shown in the reference image — no modifications, no extra text, no additional prints or graphics anywhere on the garment. ${designRef}`
  }

  if (category === 'totes') {
    return `Editorial fashion photograph. A Gen Z model (early 20s, effortlessly cool, aesthetic posture) casually holding a ${color} canvas tote bag with the design from the reference image screen-printed on center front. Model is ${angle}. Arms naturally holding or draping the tote — NEVER arms crossed. Background: ${bgColor}, clean studio lighting. Reproduce the design EXACTLY as shown in the reference image — no modifications, no extra text, no additional prints on the bag. ${designRef}`
  }

  return `Editorial fashion photograph. A Gen Z model (early 20s, effortlessly cool, natural aesthetic vibe) wearing a ${color} ${garmentType} with the design from the reference image screen-printed on the center chest. Model is ${angle}. Relaxed, confident posture — hands in pockets, at sides, or one hand touching hair. NEVER arms crossed or folded (this would cover the design). Background: ${bgColor}, clean studio lighting with subtle shadows. The print should look natural on the fabric. Reproduce the design EXACTLY as shown in the reference image — same shapes, same proportions, same elements. Do NOT add any other prints, text, logos, or graphics anywhere on the garment besides the reference design. ${designRef}`
}

function getContrastBackground(garmentColor: string): string {
  const color = garmentColor.toLowerCase()
  if (color.includes('black') || color.includes('dark') || color.includes('navy') || color.includes('charcoal')) {
    return 'warm off-white concrete wall with soft golden light'
  }
  if (color.includes('white') || color.includes('cream') || color.includes('bone') || color.includes('light')) {
    return 'deep charcoal textured wall with cool blue-tinted lighting'
  }
  if (color.includes('red') || color.includes('orange') || color.includes('rust')) {
    return 'muted sage green industrial backdrop'
  }
  if (color.includes('blue') || color.includes('teal') || color.includes('navy')) {
    return 'warm terracotta or sandy stone wall'
  }
  if (color.includes('green') || color.includes('olive') || color.includes('sage')) {
    return 'soft dusty rose or warm clay-colored wall'
  }
  // Default: neutral contrast
  return 'minimalist urban concrete with directional studio lighting'
}
