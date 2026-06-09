import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { generateImages, getAvailableImageModels } from '@/lib/design-image-engine'
import {
  getActiveGeneration,
  setActiveGeneration,
  getQueueStatus,
} from '@/lib/design-generation-queue'

/**
 * POST /next/photo-generate
 *
 * Generate photography images from prompts using the specified model(s).
 * Shares the same concurrency queue as Design Studio (1 active generation at a time).
 *
 * Body: {
 *   prompts: string[],       — image prompts (1-10)
 *   modelId: string,         — image model ID from registry
 *   metadata?: {             — tracking info
 *     photoType: string,
 *     mood: string,
 *     background: string,
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

    // Check concurrency lock (shared with Design Studio)
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
      setActiveGeneration(null)
    }

    const body = await req.json()
    const { prompts, modelId, metadata, referenceImageUrl } = body as {
      prompts: string[]
      modelId: string
      metadata?: any
      referenceImageUrl?: string
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

    // Resolve cost per image for tracking
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

    // Set active lock
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
      const result = await generateImages(prompts, modelId, userId, payload, referenceImageUrl)

      // Update cost tracking
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
        images: result.images.map((img) => ({
          id: img.id,
          base64: img.base64,
          mimeType: img.mimeType,
          prompt: img.prompt,
          model: img.model,
          modelDisplayName: img.modelDisplayName,
          index: img.index,
          costPerImage: img.costPerImage,
        })),
        model: result.model,
        modelDisplayName: result.modelDisplayName,
        totalCost: result.totalCost,
        durationMs: result.durationMs,
        durationSeconds: Math.round(result.durationMs / 1000),
        errors: result.errors,
        count: result.images.length,
      })
    } finally {
      setActiveGeneration(null)
    }
  } catch (error: any) {
    setActiveGeneration(null)
    console.error('[photo-generate] Error:', error)
    return Response.json(
      { error: error?.message || 'Photo generation failed' },
      { status: 500 },
    )
  }
}

/**
 * GET /next/photo-generate
 *
 * Get available image models + queue status.
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

    return Response.json({ imageModels, queue: queueStatus })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
