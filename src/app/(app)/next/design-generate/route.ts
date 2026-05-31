import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { generateImages, getAvailableImageModels, compositeTextOnImages } from '@/lib/design-image-engine'
import type { TextCompositeConfig } from '@/lib/design-image-engine'
import {
  getActiveGeneration,
  setActiveGeneration,
  getQueueStatus,
} from '@/lib/design-generation-queue'

/**
 * POST /next/design-generate
 *
 * Generate images from prompts using the specified model.
 * Concurrent limit: 1 active generation at a time (global).
 *
 * Body: {
 *   prompts: string[],       — array of image prompts (1-10)
 *   modelId: string,         — image model ID from registry
 *   metadata?: {             — optional metadata for tracking
 *     mode: string,
 *     promptModelUsed: string,
 *     promptCost: number,
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

    const userId = user.id
    const userEmail = (user as any).email || ''

    // Check if someone (including self) is already generating
    const active = getActiveGeneration()
    if (active) {
      const elapsed = Date.now() - active.startedAt
      if (elapsed < 5 * 60 * 1000) {
        const isSelf = active.userId === userId
        return Response.json({
          error: isSelf
            ? 'You already have a generation in progress'
            : `${active.userEmail} is generating — please wait`,
          busy: true,
          activeGeneration: {
            userEmail: active.userEmail,
            model: active.model,
            count: active.count,
            elapsedSeconds: Math.round(elapsed / 1000),
            isSelf,
          },
        }, { status: 429 })
      }
      // Stale — clear
      setActiveGeneration(null)
    }

    const body = await req.json()
    const { prompts, modelId, metadata, textComposite } = body as {
      prompts: string[]
      modelId: string
      metadata?: any
      textComposite?: TextCompositeConfig
    }

    if (!prompts?.length) {
      return Response.json({ error: 'No prompts provided' }, { status: 400 })
    }

    if (prompts.length > 10) {
      return Response.json({ error: 'Maximum 10 images per batch' }, { status: 400 })
    }

    if (!modelId) {
      return Response.json({ error: 'modelId required' }, { status: 400 })
    }

    // Resolve costPerImage for progress tracking
    let costPerImage = 0
    try {
      const models = await payload.find({
        collection: 'ai-model-registry' as any,
        where: { modelId: { equals: modelId } },
        limit: 1,
        depth: 0,
      })
      costPerImage = (models.docs[0] as any)?.costPerImage || 0
    } catch { /* */ }

    // Set active lock with progress fields
    setActiveGeneration({
      userId,
      userEmail,
      model: modelId,
      count: prompts.length,
      startedAt: Date.now(),
      completed: 0,
      failed: 0,
      currentIndex: 0,
      costSoFar: 0,
      costPerImage,
      lastImageAt: 0,
    })

    try {
      const result = await generateImages(prompts, modelId, userId, payload)

      // Text compositing: overlay crisp text on generated graphics
      let finalImages = result.images
      let rawGraphics: typeof result.images = []
      if (textComposite && result.images.length > 0) {
        payload.logger.info('[Design Generate] Running text compositor...')
        const { composited, rawGraphics: raws } = await compositeTextOnImages(
          result.images, textComposite, payload,
        )
        finalImages = composited
        rawGraphics = raws
      }

      // Update cost tracking in AI Settings
      if (result.totalCost > 0) {
        try {
          const settings = await payload.findGlobal({ slug: 'ai-settings' as any, depth: 0 })
          const currentTotal = (settings as any)?.totalSpent || 0
          const currentMonthly = (settings as any)?.monthlySpent || 0
          const lastResetMonth = (settings as any)?.lastResetMonth || ''
          const thisMonth = new Date().toISOString().slice(0, 7)

          const promptCost = metadata?.promptCost || 0
          const totalNewCost = result.totalCost + promptCost

          await payload.updateGlobal({
            slug: 'ai-settings' as any,
            data: {
              totalSpent: currentTotal + totalNewCost,
              monthlySpent: lastResetMonth === thisMonth
                ? currentMonthly + totalNewCost
                : totalNewCost,
              lastResetMonth: thisMonth,
            } as any,
          })
        } catch { /* */ }
      }

      return Response.json({
        images: finalImages.map((img) => ({
          id: img.id,
          base64: img.base64,
          mimeType: img.mimeType,
          prompt: img.prompt,
          model: img.model,
          modelDisplayName: img.modelDisplayName,
          index: img.index,
          costPerImage: img.costPerImage,
        })),
        rawGraphics: rawGraphics.length > 0 ? rawGraphics.map((img) => ({
          id: img.id,
          base64: img.base64,
          mimeType: img.mimeType,
          prompt: img.prompt,
          model: img.model,
          index: img.index,
          costPerImage: img.costPerImage,
        })) : undefined,
        textComposited: !!textComposite,
        model: result.model,
        modelDisplayName: result.modelDisplayName,
        totalCost: result.totalCost,
        promptCost: metadata?.promptCost || 0,
        grandTotalCost: result.totalCost + (metadata?.promptCost || 0),
        durationMs: result.durationMs,
        durationSeconds: Math.round(result.durationMs / 1000),
        errors: result.errors,
        count: finalImages.length,
      })
    } finally {
      // Release lock
      setActiveGeneration(null)
    }
  } catch (error: any) {
    console.error('Design generation error:', error)
    return Response.json(
      { error: error?.message || 'Image generation failed' },
      { status: 500 },
    )
  }
}

/**
 * GET /next/design-generate
 *
 * Get available image models + current generation status + queue.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const imageModels = await getAvailableImageModels(payload)
    const queueStatus = getQueueStatus(user.id)

    // Get cost tracking
    let costTracking = null
    try {
      const settings = await payload.findGlobal({ slug: 'ai-settings' as any, depth: 0 })
      costTracking = {
        totalSpent: (settings as any)?.totalSpent || 0,
        monthlySpent: (settings as any)?.monthlySpent || 0,
        monthlyBudget: (settings as any)?.monthlyBudget || 50,
      }
    } catch { /* */ }

    return Response.json({
      imageModels,
      queue: queueStatus,
      costTracking,
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
