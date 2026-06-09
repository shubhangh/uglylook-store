import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { generateProductCopy } from '@/lib/generate-product-copy'
import { safeFetchImage } from '@/lib/safe-fetch'

/**
 * POST /next/generate-copy
 *
 * Auto-generate product copy from design + product visuals.
 * Sends design image + blueprint image + mockup to Gemini for visual analysis.
 *
 * Body: {
 *   designId: string,
 *   category: string,
 *   blueprintTitle?: string,       — Printify product name (e.g., "Bella+Canvas 3001 Unisex Tee")
 *   blueprintImageUrl?: string,    — Printify blueprint product photo URL
 *   mockupMediaId?: string,        — Payload media ID of a generated mockup
 * }
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { designId, category, blueprintTitle, blueprintImageUrl, mockupMediaId, productContext } = body

    if (!designId) {
      return Response.json({ error: 'designId is required' }, { status: 400 })
    }

    // Fetch design with populated designFile for image URL
    let design: any
    try {
      design = await payload.findByID({
        collection: 'designs',
        id: designId,
        depth: 1,
      })
    } catch {
      return Response.json({ error: 'Design not found' }, { status: 404 })
    }

    const designContext: any = {
      designTitle: design.title || '',
      designLane: design.designLane || '',
      emotionTier: design.emotionTier || '',
      emotionPrimary: design.emotionPrimary || '',
      printText: design.printText || '',
      type: design.type || '',
      forCategories: design.forCategories || [],
      blueprintTitle: blueprintTitle || '',
    }

    // E4: Enrich with product context if provided
    if (productContext) {
      designContext.productDetails = [
        productContext.colors?.length ? `Available colors: ${productContext.colors.join(', ')}` : null,
        productContext.sizes?.length ? `Available sizes: ${productContext.sizes.join(', ')}` : null,
        productContext.providerTitle ? `Print provider: ${productContext.providerTitle}` : null,
        productContext.printAreaFront ? `Print area: ${productContext.printAreaFront.width}×${productContext.printAreaFront.height}px` : null,
        productContext.adminPrice ? `Retail price: $${productContext.adminPrice}` : null,
        productContext.variantCount ? `Total variants: ${productContext.variantCount}` : null,
      ].filter(Boolean).join('\n')
    }

    const garment = getGarmentType(category || 'tees')

    // Collect images to send to Gemini for visual context
    const images: { buffer: Buffer; mimeType: string; label: string }[] = []

    // 1. Design image (the actual print file)
    const designFileUrl = design.designFile?.url || design.designUrl
    if (designFileUrl) {
      const result = await safeFetchImage(designFileUrl)
      if (result) {
        images.push({ ...result, label: 'design' })
      }
    }

    // 2. Blueprint product photo (the Printify garment)
    if (blueprintImageUrl) {
      const result = await safeFetchImage(blueprintImageUrl)
      if (result) {
        images.push({ ...result, label: 'product' })
      }
    }

    // 3. Mockup image (design on product — best context)
    if (mockupMediaId) {
      try {
        const media = await payload.findByID({ collection: 'media', id: mockupMediaId, depth: 0 })
        const mediaUrl = (media as any).url
        if (mediaUrl) {
          const result = await safeFetchImage(mediaUrl)
          if (result) {
            images.push({ ...result, label: 'mockup' })
          }
        }
      } catch { /* non-critical */ }
    }

    const copy = await generateProductCopy(
      designContext,
      garment,
      category || 'tees',
      user.id,
      payload,
      images,
    )

    if (!copy) {
      return Response.json(
        { error: 'Failed to generate copy. Check that a Gemini API key is configured.' },
        { status: 500 },
      )
    }

    return Response.json({ success: true, copy })
  } catch (error: any) {
    console.error('Copy generation error:', error)
    return Response.json({ error: error?.message || 'Copy generation failed' }, { status: 500 })
  }
}

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
