/**
 * Design Prompt Engine — Claude API integration for prompt engineering.
 *
 * Takes a generation brief + context → crafts a pixel-precise image generation prompt.
 * Uses minimal tokens via pre-parsed fashion config + structured input.
 */

import { resolveApiKey } from '@/lib/ai-key-encryption'
import { buildFashionContext } from '@/lib/fashion-config'
import {
  buildGraphicsOnlyPrompt,
  buildPaletteContext,
  buildStyleContext,
} from '@/lib/gen-z-palettes'
import type { Payload } from 'payload'

// ── Types ──

export type DetailLevel = 'low' | 'medium' | 'high' | 'very-high'

export type PromptInput = {
  // Generation mode context
  mode: string
  brief?: string
  documentContent?: string // .md or .pdf content as text

  // Design parameters
  category?: string
  garmentColor?: string
  designType?: string
  designLane?: string
  emotionTier?: string
  printText?: string // for text-composition designs
  printAreaWidth?: number
  printAreaHeight?: number

  // Prompt config
  detailLevel: DetailLevel
  modelId: string // Claude model ID from registry

  // Additional context
  additionalContext?: string

  // Text composition config
  textComposite?: {
    paletteId: string
    styleId: string
    orientation: 'vertical' | 'horizontal' | 'square'
  }
}

export type PromptResult = {
  prompt: string
  modelUsed: string
  detailLevel: DetailLevel
  inputTokens: number
  outputTokens: number
  estimatedCost: number
}

// ── System Prompts per Detail Level ──

const DETAIL_INSTRUCTIONS: Record<DetailLevel, string> = {
  low: 'Generate a brief design prompt (~100 words). Focus on layout direction, main colors, text content, and basic style. Be concise.',
  medium:
    'Generate a detailed design prompt (~200 words). Include typography (font family, weight, size), visual effects (distressed, grain), spacing, and negative space.',
  high: 'Generate a precise design prompt (~350 words). Specify pixel positions, hex colors, exact font sizes in pixels, texture overlay percentages, edge treatment details.',
  'very-high':
    'Generate an exhaustive design prompt (~500 words). Specify every element to the pixel — gradient angles, grain density, micro-erosion percentages, letterform crack patterns, DPI-specific details, exact opacity values.',
}

function buildSystemPrompt(detailLevel: DetailLevel): string {
  const fashionContext = buildFashionContext()

  return `You are a design prompt engineer for UglyLook, a Gen Z streetwear brand.

${fashionContext}

YOUR JOB: Take the user's brief + all configuration parameters and output ONE detailed image generation prompt for an AI image model.

CRITICAL — USE ALL INPUTS:
- If a DESIGN TYPE is specified (text-composition, graphic, mixed, abstract), the prompt MUST follow that type's rules.
- If a DESIGN LANE is specified (1-5), the prompt MUST match that lane's aesthetic — lane 1 is text-only, lane 3 is weirdcore, etc.
- If an EMOTION TIER is specified (A/B/C), the design MUST trigger that specific emotional response.
- If a PRODUCT CATEGORY is specified (tees, hoodies, hats), adapt the complexity and scale accordingly.
- If a GARMENT COLOR is specified, the design colors MUST contrast well against it.
- If PRINT TEXT is specified, that exact text MUST appear in the design.
- If a FASHION DOCUMENT is provided, treat it as the PRIMARY creative direction — extract visual themes, mood, references from it.
- If SKU CONTEXT is provided, design specifically for that product's constraints (print area, decoration method, available colors).
- If ADDITIONAL BRIEF is provided alongside a fashion document, use BOTH as context — the brief adds specifics on top of the document's direction.

OUTPUT RULES:
- Output ONLY the image prompt — no explanation, no preamble, no markdown, no quotes.
- The prompt is for generating a standalone PRINT-READY DESIGN — transparent background, no product, no model, no garment.
- ${DETAIL_INSTRUCTIONS[detailLevel]}
- Always specify: dimensions in pixels, colors as hex codes, transparent background.
- The design must be print-ready: high contrast, clean edges, suitable for DTG/DTF printing.
- Follow the brand's emotional inventory and design lane rules strictly.`
}

function buildUserPrompt(input: PromptInput): string {
  const parts: string[] = []

  // Primary brief — the user's creative direction
  if (input.brief) {
    parts.push(`BRIEF: ${input.brief}`)
  }

  // Design configuration — all selections matter for the output
  const config: string[] = []
  if (input.designType) {
    const typeDescriptions: Record<string, string> = {
      'text-composition': 'Typography-only design — bold text, no imagery. The text IS the design.',
      'graphic': 'Graphic/illustration design — visual imagery, no text or minimal text.',
      'mixed': 'Mixed design — combines typography with graphic elements.',
      'abstract': 'Abstract/pattern design — shapes, textures, experimental visuals.',
      'logo-placement': 'Logo placement — brand logo positioned on the garment.',
    }
    config.push(`Design type: ${input.designType}${typeDescriptions[input.designType] ? ` — ${typeDescriptions[input.designType]}` : ''}`)
  }
  if (input.designLane) {
    const laneDescriptions: Record<string, string> = {
      '1': 'Lane 1: Ironic text-only — bold typography, declarative/absurdist phrases',
      '2': 'Lane 2: Anti-design / brutalist — Helvetica blown up, broken layouts, error-message energy',
      '3': 'Lane 3: Weirdcore / liminal — eyeballs, CRT distortion, uncanny imagery',
      '4': 'Lane 4: Maximalist collage / chaos-print — layered imagery, clashing type, deliberate overload',
      '5': 'Lane 5: Y2K-adjacent — use as seasoning only, most crowded lane',
    }
    config.push(laneDescriptions[input.designLane] || `Design lane: ${input.designLane}`)
  }
  if (input.emotionTier) {
    config.push(`Target emotion tier: ${input.emotionTier} — design must trigger THIS emotional response in the viewer`)
  }
  if (input.category) {
    const categoryHints: Record<string, string> = {
      tees: 'T-shirt — front chest print, must read at arm\'s length',
      hoodies: 'Hoodie — larger print area, can be bolder/more detailed',
      hats: 'Hat — small embroidery/patch area, simple shapes, 1-2 colors max',
      totes: 'Tote bag — full side print, can be more complex',
      sweatshirts: 'Sweatshirt — similar to hoodie, center chest placement',
    }
    config.push(`Product category: ${input.category}${categoryHints[input.category] ? ` — ${categoryHints[input.category]}` : ''}`)
  }
  if (input.garmentColor) {
    config.push(`Garment color: ${input.garmentColor} — design colors MUST contrast well against this. ${input.garmentColor.toLowerCase().includes('black') ? 'Use light/bright colors.' : input.garmentColor.toLowerCase().includes('bone') || input.garmentColor.toLowerCase().includes('cream') || input.garmentColor.toLowerCase().includes('white') ? 'Use dark/bold colors.' : 'Choose colors that pop against this background.'}`)
  }
  if (input.printText) {
    config.push(`Text content for design: "${input.printText}" — this exact text must appear in the design`)
  }

  if (config.length > 0) {
    parts.push(`\nDESIGN CONFIGURATION:\n${config.join('\n')}`)
  }

  // Print area specs
  if (input.printAreaWidth && input.printAreaHeight) {
    parts.push(`\nDIMENSIONS: ${input.printAreaWidth}×${input.printAreaHeight}px at 300 DPI`)
  } else {
    parts.push('\nDIMENSIONS: 4500×5400px at 300 DPI (standard front chest)')
  }
  parts.push('Background: transparent (PNG)')

  // Fashion document content — full creative direction
  if (input.documentContent) {
    const truncated = input.documentContent.split(/\s+/).slice(0, 800).join(' ')
    parts.push(`\nFASHION DOCUMENT (use as primary creative direction):\n${truncated}`)
  }

  // Text composition: inject palette + style context
  if (input.textComposite) {
    const { paletteId, styleId } = input.textComposite
    const paletteCtx = buildPaletteContext(paletteId)
    const styleCtx = buildStyleContext(styleId)
    if (paletteCtx) parts.push(`\n${paletteCtx}`)
    if (styleCtx) parts.push(`\n${styleCtx}`)
  }

  // Additional context (SKU details, etc.)
  if (input.additionalContext) {
    parts.push(`\n${input.additionalContext}`)
  }

  return parts.join('\n')
}

// ── Main Function ──

/**
 * Generate a design prompt using Claude.
 *
 * @param input — generation parameters
 * @param userId — current user ID (for key resolution)
 * @param payload — Payload instance
 */
export async function generateDesignPrompt(
  input: PromptInput,
  userId: string | null,
  payload: Payload,
): Promise<PromptResult> {
  // Text-composition mode: use graphics-only template directly (no Claude needed)
  if (input.textComposite) {
    const { paletteId, styleId, orientation } = input.textComposite
    const prompt = buildGraphicsOnlyPrompt(paletteId, styleId, orientation)
    payload.logger.info(`[Prompt Engine] Using graphics-only template (palette: ${paletteId}, style: ${styleId})`)
    return {
      prompt,
      modelUsed: 'template',
      detailLevel: input.detailLevel,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
    }
  }

  // Resolve API key
  const apiKey = await resolveApiKey('anthropic', userId, payload)
  if (!apiKey) {
    throw new Error('No Anthropic API key configured. Set one in AI Settings → API Keys.')
  }

  // Resolve model ID — use input.modelId or fall back to default
  let modelId = input.modelId
  if (!modelId) {
    // Try AI Settings default
    try {
      const settings = await payload.findGlobal({ slug: 'ai-settings' as any, depth: 1 })
      const defaultModel = (settings as any)?.defaultPromptModel
      if (defaultModel && typeof defaultModel === 'object') {
        modelId = defaultModel.modelId
      } else if (typeof defaultModel === 'string') {
        const model = await payload.findByID({
          collection: 'ai-model-registry' as any,
          id: defaultModel,
          depth: 0,
        })
        modelId = (model as any)?.modelId
      }
    } catch { /* */ }

    // Ultimate fallback
    if (!modelId) modelId = 'claude-haiku-4-5-20251001'
  }

  const systemPrompt = buildSystemPrompt(input.detailLevel)
  const userPrompt = buildUserPrompt(input)

  payload.logger.info(`[Prompt Engine] Calling ${modelId} (detail: ${input.detailLevel})...`)

  // Call Claude API
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Claude API error ${res.status}: ${errBody}`)
  }

  const data = await res.json()

  const prompt =
    data.content?.[0]?.text?.trim() || ''
  const inputTokens = data.usage?.input_tokens || 0
  const outputTokens = data.usage?.output_tokens || 0

  // Estimate cost from model registry
  let estimatedCost = 0
  try {
    const models = await payload.find({
      collection: 'ai-model-registry' as any,
      where: { modelId: { equals: modelId } },
      limit: 1,
      depth: 0,
    })
    const model = models.docs[0] as any
    if (model) {
      const inCost = (model.costPer1kInputTokens || 0) * (inputTokens / 1000)
      const outCost = (model.costPer1kOutputTokens || 0) * (outputTokens / 1000)
      estimatedCost = Math.round((inCost + outCost) * 10000) / 10000
    }
  } catch { /* */ }

  payload.logger.info(
    `[Prompt Engine] Generated ${outputTokens} tokens. Cost: $${estimatedCost}`,
  )

  return {
    prompt,
    modelUsed: modelId,
    detailLevel: input.detailLevel,
    inputTokens,
    outputTokens,
    estimatedCost,
  }
}

/**
 * Estimate prompt cost without generating.
 * Based on average token counts per detail level.
 */
export async function estimatePromptCost(
  modelId: string,
  detailLevel: DetailLevel,
  payload: Payload,
): Promise<{ inputTokens: number; outputTokens: number; cost: number }> {
  const avgTokens: Record<DetailLevel, { input: number; output: number }> = {
    low: { input: 500, output: 150 },
    medium: { input: 550, output: 300 },
    high: { input: 600, output: 500 },
    'very-high': { input: 650, output: 750 },
  }

  const tokens = avgTokens[detailLevel]

  try {
    const models = await payload.find({
      collection: 'ai-model-registry' as any,
      where: { modelId: { equals: modelId } },
      limit: 1,
      depth: 0,
    })
    const model = models.docs[0] as any
    if (model) {
      const cost =
        (model.costPer1kInputTokens || 0) * (tokens.input / 1000) +
        (model.costPer1kOutputTokens || 0) * (tokens.output / 1000)
      return { inputTokens: tokens.input, outputTokens: tokens.output, cost: Math.round(cost * 10000) / 10000 }
    }
  } catch { /* */ }

  return { inputTokens: tokens.input, outputTokens: tokens.output, cost: 0.001 }
}
