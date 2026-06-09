import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

/**
 * POST /next/photo-approve
 *
 * Approve a generated photo → upload to R2 via Payload media → save to Photos collection.
 *
 * Body: {
 *   base64: string,          — image data
 *   mimeType: string,        — "image/png" or "image/jpeg"
 *   title: string,
 *   photoType: string,       — "campaign-hero" | "on-model" | etc.
 *   background: string,
 *   mood: string,
 *   prompt: string,
 *   products?: string[],     — product IDs to link
 *   designs?: string[],      — design IDs to link
 *   model: {
 *     provider: string,
 *     id: string,
 *     displayName: string,
 *   },
 *   cost: number,
 *   tags?: string[],
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
    const { base64, mimeType, title, photoType, background, mood, prompt, products, designs, model, cost, tags } = body

    if (!base64) {
      return Response.json({ error: 'base64 image data required' }, { status: 400 })
    }
    if (!title) {
      return Response.json({ error: 'title required' }, { status: 400 })
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64')
    const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png'
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
    const filename = `photo-${slug}-${Date.now()}.${ext}`

    // Upload to Payload media (→ R2)
    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: title,
      },
      file: {
        data: buffer,
        mimetype: mimeType || 'image/png',
        name: filename,
        size: buffer.length,
      },
    })

    const imageUrl = mediaDoc.url || ''

    // Create Photos document
    const photoDoc = await payload.create({
      collection: 'photos' as any,
      data: {
        title,
        imageFile: mediaDoc.id,
        imageUrl,
        photoType: photoType || 'campaign-hero',
        background: background || 'near-black',
        mood: mood || 'neutral',
        prompt: prompt || '',
        products: products || [],
        designs: designs || [],
        imageModel: model?.id || '',
        imageModelDisplayName: model?.displayName || '',
        generationCost: cost || 0,
        generatedAt: new Date().toISOString(),
        generatedByUser: user.id,
        status: 'active',
        tags: tags || [],
      } as any,
    })

    payload.logger.info(`[Photo Approve] Saved photo "${title}" (${photoDoc.id}) → ${imageUrl}`)

    return Response.json({
      photoId: photoDoc.id,
      mediaId: mediaDoc.id,
      imageUrl,
      title,
    })
  } catch (error: any) {
    console.error('[photo-approve] Error:', error)
    return Response.json(
      { error: error?.message || 'Failed to save photo' },
      { status: 500 },
    )
  }
}
