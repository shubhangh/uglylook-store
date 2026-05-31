import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

/**
 * POST /next/design-approve
 *
 * Approve a generated image → upload to R2 via Payload media → save to Designs collection.
 *
 * Body: {
 *   base64: string,          — image data
 *   mimeType: string,        — "image/png" or "image/jpeg"
 *   metadata: {
 *     title: string,
 *     type: string,           — "logo" | "text-composition" | "graphic" | etc.
 *     designLane?: string,
 *     emotionTier?: string,
 *     emotionPrimary?: string,
 *     forCategories?: string[],
 *     forGarmentColors?: string[],
 *     printText?: string,
 *     fontInfo?: string,
 *     tags?: string[],
 *     generatedBy: string,    — model ID
 *     generationPrompt: string,
 *     generationCost: number,
 *     promptModel?: string,
 *     imageModel?: string,
 *     presetId?: string,
 *     alsoInMedia?: boolean,
 *     // Text composition fields
 *     sourceGraphic?: {       — raw AI graphic to save to ai-graphics collection
 *       base64: string,
 *       mimeType: string,
 *       palette?: string,
 *       style?: string,
 *       orientation?: string,
 *     },
 *   }
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
    const { base64, mimeType, metadata } = body

    if (!base64) {
      return Response.json({ error: 'base64 image data required' }, { status: 400 })
    }

    if (!metadata?.title) {
      return Response.json({ error: 'metadata.title required' }, { status: 400 })
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, 'base64')
    const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png'
    const slug = metadata.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
    const filename = `design-${slug}-${Date.now()}.${ext}`

    // Upload to Payload media (→ R2)
    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: metadata.title,
      },
      file: {
        data: buffer,
        mimetype: mimeType || 'image/png',
        name: filename,
        size: buffer.length,
      },
    })

    // Get the R2 URL from the media document
    const designUrl = (mediaDoc as any).url || ''

    // Save raw AI graphic to ai-graphics collection (if text-composition workflow)
    let sourceGraphicId: string | undefined
    if (metadata.sourceGraphic?.base64) {
      try {
        const rawBuffer = Buffer.from(metadata.sourceGraphic.base64, 'base64')
        const rawExt = metadata.sourceGraphic.mimeType === 'image/jpeg' ? 'jpg' : 'png'
        const rawFilename = `ai-graphic-${slug}-${Date.now()}.${rawExt}`

        const rawMediaDoc = await payload.create({
          collection: 'media',
          data: { alt: `Raw graphic: ${metadata.title}` },
          file: {
            data: rawBuffer,
            mimetype: metadata.sourceGraphic.mimeType || 'image/png',
            name: rawFilename,
            size: rawBuffer.length,
          },
        })

        const aiGraphicDoc = await payload.create({
          collection: 'ai-graphics' as any,
          data: {
            title: `${metadata.title} (raw)`,
            imageFile: rawMediaDoc.id,
            imageUrl: (rawMediaDoc as any).url || '',
            palette: metadata.sourceGraphic.palette || undefined,
            style: metadata.sourceGraphic.style || undefined,
            orientation: metadata.sourceGraphic.orientation || undefined,
            generationPrompt: metadata.generationPrompt || '',
            imageModel: metadata.imageModel || '',
            generationCost: metadata.generationCost || 0,
            status: 'active',
          } as any,
        })

        sourceGraphicId = aiGraphicDoc.id
        payload.logger.info(`[Design Approve] Saved raw graphic ${aiGraphicDoc.id}`)
      } catch (err: any) {
        payload.logger.error(`[Design Approve] Failed to save raw graphic: ${err.message}`)
      }
    }

    // Create Designs collection document
    const designDoc = await payload.create({
      collection: 'designs' as any,
      data: {
        title: metadata.title,
        designFile: mediaDoc.id,
        designUrl,
        type: metadata.type || 'graphic',
        designLane: metadata.designLane || undefined,
        emotionTier: metadata.emotionTier || undefined,
        emotionPrimary: metadata.emotionPrimary || '',
        forCategories: metadata.forCategories || [],
        forGarmentColors: metadata.forGarmentColors || [],
        printText: metadata.printText || '',
        fontInfo: metadata.fontInfo || '',
        tags: metadata.tags || [],
        generatedBy: metadata.generatedBy || '',
        generationPrompt: metadata.generationPrompt || '',
        generationCost: metadata.generationCost || 0,
        promptModel: metadata.promptModel || '',
        imageModel: metadata.imageModel || '',
        preset: metadata.presetId || undefined,
        sourceGraphic: sourceGraphicId || undefined,
        status: 'active',
        alsoInMedia: metadata.alsoInMedia || false,
        printWidth: 1024,
        printHeight: 1024,
        dpi: 300,
      } as any,
    })

    // Update AI graphic usage count
    if (sourceGraphicId) {
      try {
        const graphic = await payload.findByID({ collection: 'ai-graphics' as any, id: sourceGraphicId, depth: 0 })
        await payload.update({
          collection: 'ai-graphics' as any,
          id: sourceGraphicId,
          data: { usageCount: ((graphic as any).usageCount || 0) + 1 } as any,
        })
      } catch { /* non-critical */ }
    }

    // If preset was used, update preset stats
    if (metadata.presetId) {
      try {
        const preset = await payload.findByID({
          collection: 'design-presets' as any,
          id: metadata.presetId,
          depth: 0,
        })
        await payload.update({
          collection: 'design-presets' as any,
          id: metadata.presetId,
          data: {
            timesUsed: ((preset as any).timesUsed || 0) + 1,
            designsGenerated: ((preset as any).designsGenerated || 0) + 1,
            lastUsedAt: new Date().toISOString(),
          } as any,
        })
      } catch { /* preset update failure shouldn't block approval */ }
    }

    payload.logger.info(
      `[Design Approve] Saved "${metadata.title}" (${designDoc.id}) — media: ${mediaDoc.id}`,
    )

    return Response.json({
      success: true,
      designId: designDoc.id,
      mediaId: mediaDoc.id,
      designUrl,
      title: metadata.title,
    })
  } catch (error: any) {
    console.error('Design approve error:', error)
    return Response.json(
      { error: error?.message || 'Failed to save design' },
      { status: 500 },
    )
  }
}
