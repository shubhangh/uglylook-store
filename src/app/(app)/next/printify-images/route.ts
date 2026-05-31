import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'
import {
  generateProductImages,
  isImagePipelineConfigured,
} from '@/lib/image-pipeline'

/**
 * POST /next/printify-images
 *
 * Generate storefront images for a product using the AI image pipeline.
 * Downloads generated images and uploads them to Payload media (R2).
 *
 * Body: {
 *   productId: string,        — Payload product ID
 *   designUrl?: string,       — override design URL (otherwise reads from product.printifyConfig.designUrl)
 *   editorialCount?: number,  — number of editorial shots (default 3)
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

    if (!(await isImagePipelineConfigured(payload))) {
      return Response.json(
        { error: 'Image pipeline not configured. Set BFL key in AI Settings or BFL_API_KEY env var.' },
        { status: 400 },
      )
    }

    const body = await req.json()
    const { productId, designUrl: overrideDesignUrl, editorialCount = 3 } = body

    if (!productId) {
      return Response.json({ error: 'productId required' }, { status: 400 })
    }

    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 1,
    })

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    const p = product as any
    const config_ = p.printifyConfig
    const designUrl = overrideDesignUrl || config_?.designUrl || ''

    // Determine category
    let category = 'tees'
    if (p.categories?.length) {
      const cat = typeof p.categories[0] === 'object' ? p.categories[0] : null
      if (cat) {
        const slug = cat.slug || cat.title?.toLowerCase() || ''
        if (slug.includes('hoodie')) category = 'hoodies'
        else if (slug.includes('hat') || slug.includes('cap')) category = 'hats'
        else if (slug.includes('tote') || slug.includes('bag')) category = 'totes'
        else if (slug.includes('sweat') || slug.includes('crew')) category = 'sweatshirts'
      }
    }

    payload.logger.info(`[Image Pipeline] Generating images for "${p.title}" (${category})...`)

    // Generate images
    const result = await generateProductImages(
      p.title,
      category,
      designUrl,
      editorialCount,
      payload,
    )

    // Download generated images and upload to Payload media
    const uploadedGallery: string[] = []

    const imagesToUpload = [
      ...(result.compositeImageUrl ? [{ url: result.compositeImageUrl, label: 'composite' }] : []),
      ...result.editorialImageUrls.map((url, i) => ({ url, label: `editorial-${i + 1}` })),
    ]

    for (const img of imagesToUpload) {
      try {
        // Download image
        const imgRes = await fetch(img.url)
        if (!imgRes.ok) continue

        const buffer = Buffer.from(await imgRes.arrayBuffer())
        const slug = p.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-') || 'product'
        const filename = `${slug}-${img.label}.jpg`

        // Upload to Payload media
        const file = {
          data: buffer,
          mimetype: 'image/jpeg',
          name: filename,
          size: buffer.length,
        }

        const media = await payload.create({
          collection: 'media',
          data: {
            alt: `${p.title} — ${img.label}`,
          },
          file,
        })

        uploadedGallery.push(media.id)
        payload.logger.info(`[Image Pipeline] Uploaded ${filename} (${media.id})`)
      } catch (err: any) {
        result.errors.push(`Upload failed for ${img.label}: ${err.message}`)
      }
    }

    // Add uploaded images to product gallery
    if (uploadedGallery.length > 0) {
      const existingGallery = p.gallery || []
      const newGalleryItems = uploadedGallery.map((mediaId) => ({
        image: mediaId,
      }))

      await payload.update({
        collection: 'products',
        id: productId,
        data: {
          gallery: [...existingGallery, ...newGalleryItems],
        } as any,
      })

      payload.logger.info(
        `[Image Pipeline] Added ${uploadedGallery.length} images to "${p.title}" gallery`,
      )
    }

    return Response.json({
      success: true,
      productId,
      imagesGenerated: imagesToUpload.length,
      imagesUploaded: uploadedGallery.length,
      errors: result.errors,
      rawImageUrl: result.rawImageUrl,
      compositeImageUrl: result.compositeImageUrl,
      editorialImageUrls: result.editorialImageUrls,
    })
  } catch (error: any) {
    console.error('Image pipeline error:', error)
    return Response.json(
      { error: error?.message || 'Image generation failed' },
      { status: 500 },
    )
  }
}

/**
 * GET /next/printify-images
 *
 * Check if image pipeline is configured.
 */
export async function GET(): Promise<Response> {
  const payload = await getPayload({ config })
  return Response.json({
    configured: await isImagePipelineConfigured(payload),
    provider: 'BFL (Flux Pro Ultra + FLUX.2 Pro)',
    keySource: 'AI Settings → BFL_API_KEY env fallback',
  })
}
