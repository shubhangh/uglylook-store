import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import {
  generateDesignPrompt,
  estimatePromptCost,
  type PromptInput,
  type DetailLevel,
} from '@/lib/design-prompt-engine'
import { getFashionConfig } from '@/lib/fashion-config'

/**
 * POST /next/design-prompt
 *
 * Generate a design prompt using Claude.
 * Returns the prompt text for admin review/edit before image generation.
 *
 * Body: PromptInput (mode, brief, detailLevel, modelId, category, etc.)
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

    const input: PromptInput = {
      mode: body.mode || 'free-brief',
      brief: body.brief || '',
      documentContent: body.documentContent || '',
      category: body.category || '',
      garmentColor: body.garmentColor || '',
      designType: body.designType || '',
      designLane: body.designLane || '',
      emotionTier: body.emotionTier || '',
      printText: body.printText || '',
      printAreaWidth: body.printAreaWidth || 4500,
      printAreaHeight: body.printAreaHeight || 5400,
      detailLevel: (body.detailLevel || 'medium') as DetailLevel,
      modelId: body.modelId || '',
      additionalContext: body.additionalContext || '',
    }

    // For bulk text mode — generate one prompt per text line
    if (body.bulkTexts && Array.isArray(body.bulkTexts)) {
      const results = []
      for (const text of body.bulkTexts.slice(0, 10)) {
        const textInput = { ...input, printText: text, brief: input.brief || `Design with text: "${text}"` }
        const result = await generateDesignPrompt(textInput, user.id, payload)
        results.push({ text, ...result })
      }
      return Response.json({ bulk: true, prompts: results })
    }

    const result = await generateDesignPrompt(input, user.id, payload)

    return Response.json({
      prompt: result.prompt,
      modelUsed: result.modelUsed,
      detailLevel: result.detailLevel,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: result.estimatedCost,
    })
  } catch (error: any) {
    console.error('Design prompt error:', error)
    return Response.json(
      { error: error?.message || 'Prompt generation failed' },
      { status: 500 },
    )
  }
}

/**
 * GET /next/design-prompt
 *
 * Get cost estimates and fashion config for the Design Studio UI.
 *
 * Query: modelId, detailLevel
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const url = new URL(req.url)
    const modelId = url.searchParams.get('modelId') || 'claude-haiku-4-5-20251001'
    const detailLevel = (url.searchParams.get('detailLevel') || 'medium') as DetailLevel

    const estimate = await estimatePromptCost(modelId, detailLevel, payload)
    const fashionConfig = getFashionConfig()

    // Get available prompt models from registry
    const promptModels = await payload.find({
      collection: 'ai-model-registry' as any,
      where: {
        modelType: { equals: 'prompt' },
        isEnabled: { equals: true },
      },
      sort: 'family',
      depth: 0,
    })

    // Group by family
    const families: Record<string, any[]> = {}
    for (const model of promptModels.docs) {
      const m = model as any
      if (!families[m.family]) families[m.family] = []
      families[m.family].push({
        id: m.id,
        modelId: m.modelId,
        displayName: m.displayName,
        version: m.version,
        tag: m.tag,
        isDefault: m.isDefault,
        costPer1kInput: m.costPer1kInputTokens,
        costPer1kOutput: m.costPer1kOutputTokens,
        provider: m.provider,
        shortDescription: m.shortDescription || '',
      })
    }

    return Response.json({
      estimate,
      fashionConfig,
      promptModels: families,
      detailLevels: [
        { value: 'low', label: 'Low (~100 words)', avgOutputTokens: 150 },
        { value: 'medium', label: 'Medium (~200 words)', avgOutputTokens: 300 },
        { value: 'high', label: 'High (~350 words)', avgOutputTokens: 500 },
        { value: 'very-high', label: 'Very High (~500 words)', avgOutputTokens: 750 },
      ],
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
