/**
 * Photo Prompt Engine — generates photography-specific prompts using Claude.
 *
 * Produces highly prescriptive, consistency-focused prompts for AI image models.
 * The goal: every image in a batch looks like it came from the same professional
 * studio shoot — same model, same lighting, same background, same garment.
 *
 * Reuses: resolveApiKey from ai-key-encryption (shared with Design Studio).
 */

import { resolveApiKey } from '@/lib/ai-key-encryption'
import type { Payload } from 'payload'

// ── Types ──

export type PhotoType =
  | 'campaign-hero'
  | 'on-model'
  | 'flat-lay'
  | 'detail-texture'
  | 'editorial'
  | 'group-crew'

export type PhotoBackground = 'near-black' | 'cream' | 'environment' | 'concrete' | 'custom'
export type PhotoMood = 'neutral' | 'dramatic' | 'editorial' | 'raw' | 'clinical'
export type DetailLevel = 'low' | 'medium' | 'high' | 'very-high'

export type PhotoPromptInput = {
  photoType: PhotoType
  brief?: string
  background: PhotoBackground
  mood: PhotoMood
  detailLevel: DetailLevel
  modelId: string

  // Context from selected items
  productContext?: string
  designContext?: string
  presetTemplate?: string

  // Editorial-specific
  environment?: string

  // Image references for consistency
  imageRefContext?: string
  // Model type (boy, girl, kid-boy, kid-girl)
  modelTypeContext?: string
}

export type PhotoPromptResult = {
  prompt: string
  modelUsed: string
  detailLevel: DetailLevel
  inputTokens: number
  outputTokens: number
  estimatedCost: number
}

// ── Brand Photography Rules (strict) ──

const BRAND_PHOTOGRAPHY_RULES = `
BRAND: UglyLook — Gen Z streetwear. "Ugly is the new sick."

ABSOLUTE RULES — VIOLATING ANY OF THESE MAKES THE IMAGE UNUSABLE:

1. BACKGROUND: Solid, seamless, uniform color. NOTHING else visible — no gradients, no textures, no props, no furniture, no plants, no walls with texture. Just pure flat color filling the entire background.

2. SCENE CONTENT: ONLY the model wearing the product. NOTHING ELSE IN THE FRAME. No studio equipment (lights, umbrellas, reflectors, stands, softboxes). No props. No accessories beyond the garment. No sunglasses, no jewelry, no bags, no shoes visible. The image contains EXACTLY: one person + one garment + solid background. That's it.

3. MODEL CONSISTENCY: The model must look like the SAME PERSON across all shots in a batch. Same face, same skin tone, same hair style, same hair color, same body type, same height. If generating multiple images, they must look like the same photoshoot with the same model.

4. MODEL APPEARANCE: Clean, minimal styling. No makeup visible. Natural skin. Hair neat but unstyled. The model is a canvas — the garment is the star.

5. MODEL EXPRESSION: Completely neutral. No smile. No pout. No attitude. Blank, deadpan, flat expression. Eyes looking directly at camera or slightly off-center.

6. MODEL POSE: Minimal, static. Standing straight. Hands at sides, or one hand in pocket, or thumbs hooked in waistband. NO dynamic poses. NO crossed arms. NO hands on hips. NO action shots. The model stands still like a mannequin that happens to be alive.

7. THE GARMENT: The product shown MUST be EXACTLY as described — same color, same print/graphic, same fit. Do NOT invent, modify, reinterpret, or stylize the design. If a graphic is described, reproduce it EXACTLY. If text is on the garment, spell it EXACTLY. The garment is oversized, boxy fit, dropped shoulders.

8. LIGHTING: Invisible. The lighting should make the product look great but the light SOURCE must never be visible or implied. Soft, even, professional studio lighting. No harsh shadows on face. Subtle shadow under the model on the ground. No dramatic rim lights. No colored gels. Think: Zara or COS product photography.

9. FRAMING: Model from mid-thigh to top of head. Product fills 60-70% of frame. Generous negative space above and to sides. Centered composition. Portrait orientation (4:5 ratio).

10. QUALITY: High-end fashion e-commerce photography. Think: SSENSE, END Clothing, Mr Porter product pages. Clean, sharp, professional. No film grain, no vintage filters, no lo-fi aesthetic. Modern digital photography look.

PRODUCT DETAILS:
- Tees: 240gsm combed ringspun cotton, boxy fit, DTG printed
- Hoodies: 320-380gsm brushed fleece, oversized, dropped shoulder, kangaroo pocket
- Hats: structured snapback or unstructured dad cap
- Totes: heavy canvas, wide handles
`.trim()

// ── Detail Level Instructions ──

const PHOTO_DETAIL_INSTRUCTIONS: Record<DetailLevel, string> = {
  low: 'Write a concise prompt (~80 words). Focus on: model description, exact garment, background color, pose.',
  medium: 'Write a detailed prompt (~150 words). Include: specific model features (ethnicity, build, hair), exact garment details (color, fit, print description), background specification, pose, lighting quality, framing.',
  high: 'Write a precise prompt (~250 words). Include everything in medium plus: fabric texture visibility, print placement and size, shadow behavior, skin tone rendering, color temperature, depth of field.',
  'very-high': 'Write an exhaustive prompt (~400 words). Include everything in high plus: exact color values, tonal range, contrast ratio, fabric drape physics, print ink texture, pore-level skin detail, micro-shadow behavior.',
}

// ── Photo Type Templates ──

const PHOTO_TYPE_CONTEXT: Record<PhotoType, string> = {
  'campaign-hero':
    'CAMPAIGN HERO — The flagship product image. Model wearing the garment, standing still, facing camera. This is the primary image customers see. Must be flawless, clean, and professional. The garment and its print/design must be the clear focal point.',
  'on-model':
    'ON-MODEL PRODUCT SHOT — Standard e-commerce product photography. Model standing straight, garment clearly visible. Print/design must be sharp and legible. This is a product listing photo — clarity and accuracy over artistry.',
  'flat-lay':
    'FLAT LAY — Garment laid flat on solid-color surface, shot from directly above. Neatly arranged, no wrinkles. Single soft shadow. No other objects in frame.',
  'detail-texture':
    'DETAIL / TEXTURE CLOSE-UP — Tight crop on fabric texture or print detail. Shallow depth of field. Show thread weave, ink texture, print quality. Background is the garment itself.',
  editorial:
    'EDITORIAL — Model wearing the garment in a real-world environment. The ONLY exception where background is not solid color. Environment should be mundane/industrial (parking garage, subway, loading dock). Model still has neutral expression and minimal posing.',
  'group-crew':
    'GROUP SHOT — 2-4 models, each wearing different garments. All standing in a line or staggered. All neutral expressions. All facing camera. Solid background. Each garment clearly visible.',
}

const BACKGROUND_CONTEXT: Record<PhotoBackground, string> = {
  'near-black': 'BACKGROUND: Solid near-black (#111111). Completely uniform, seamless, no texture, no gradient. Pure dark background.',
  cream: 'BACKGROUND: Solid warm cream (#F5F2EC). Completely uniform, seamless, no texture, no gradient. Pure light background.',
  environment: 'BACKGROUND: Real environment (only for editorial type). Mundane/industrial setting. No pretty locations.',
  concrete: 'BACKGROUND: Solid concrete grey. Uniform, minimal texture. No graffiti, no markings.',
  custom: 'BACKGROUND: As specified in brief. Must be solid and uniform unless editorial type.',
}

const MOOD_CONTEXT: Record<PhotoMood, string> = {
  neutral: 'MOOD: Flat, neutral, commercial. Clean e-commerce energy. No drama.',
  dramatic: 'MOOD: Higher contrast, deeper shadows. Still professional and clean.',
  editorial: 'MOOD: Fashion magazine editorial. Slightly elevated but still deadpan.',
  raw: 'MOOD: Raw, direct. Slightly harder lighting. Still professional.',
  clinical: 'MOOD: Ultra-clean, flat lighting. Product documentation quality.',
}

// ── Build Prompts ──

function buildSystemPrompt(detailLevel: DetailLevel): string {
  return `You are a fashion photography prompt engineer for UglyLook streetwear.

You write prompts for AI image generation models (Flux, Gemini, GPT-Image).

${BRAND_PHOTOGRAPHY_RULES}

YOUR TASK: Generate ONE image prompt based on the user's configuration.

CRITICAL OUTPUT RULES:
- Output ONLY the image prompt text. No explanation, no preamble, no markdown, no quotes.
- The prompt must describe a PHOTOGRAPH — not an illustration, not a render, not a painting.
- Do NOT mention camera equipment, lens models, or photography gear in the prompt. Just describe what the final image LOOKS LIKE.
- Do NOT use words like "studio", "softbox", "umbrella", "reflector", "strobe" — describe the RESULT (soft even lighting, subtle shadows) not the EQUIPMENT.
- ${PHOTO_DETAIL_INSTRUCTIONS[detailLevel]}
- CONSISTENCY IS EVERYTHING. Every prompt in a batch must describe the same model, same lighting, same background, same garment. Only the pose/angle changes.
- The garment description must be EXACT. Never paraphrase, reinterpret, or invent design details.
- Start the prompt with the most important element: the model and the garment.`
}

function buildUserPrompt(input: PhotoPromptInput): string {
  const parts: string[] = []

  // Photo type context
  parts.push(PHOTO_TYPE_CONTEXT[input.photoType])
  parts.push('')

  // Background + mood
  parts.push(BACKGROUND_CONTEXT[input.background])
  parts.push(MOOD_CONTEXT[input.mood])
  parts.push('')

  // Model type — be very specific for consistency
  if (input.modelTypeContext) {
    parts.push(`MODEL SPECIFICATION: ${input.modelTypeContext}`)
    parts.push('IMPORTANT: Describe a SPECIFIC model appearance (exact ethnicity, hair style, body type) so that multiple images look like the same person.')
    parts.push('')
  }

  // Product context (from selected products)
  if (input.productContext) {
    parts.push(`GARMENT TO SHOW:\n${input.productContext}`)
    parts.push('The model MUST be wearing THIS EXACT garment. Do not alter the design, color, or any detail.')
    parts.push('')
  }

  // Design context (from selected designs)
  if (input.designContext) {
    parts.push(`PRINT/GRAPHIC ON THE GARMENT:\n${input.designContext}`)
    parts.push('The print must appear EXACTLY as described — same text, same graphics, same placement. Do NOT modify it.')
    parts.push('')
  }

  // Image references for visual consistency
  if (input.imageRefContext) {
    parts.push(input.imageRefContext)
    parts.push('')
  }

  // Environment (editorial only)
  if (input.photoType === 'editorial' && input.environment) {
    parts.push(`ENVIRONMENT: ${input.environment}`)
    parts.push('')
  }

  // User brief (additional direction)
  if (input.brief) {
    parts.push(`ADDITIONAL DIRECTION: ${input.brief}`)
    parts.push('')
  }

  // Preset template (if any)
  if (input.presetTemplate) {
    parts.push(`TEMPLATE:\n${input.presetTemplate}`)
  }

  // Final reminder
  parts.push('')
  parts.push('FINAL REMINDER: The output image must contain ONLY the model + the garment + solid background. NOTHING else. No equipment, no props, no accessories, no text overlays. Professional fashion e-commerce photography.')

  return parts.join('\n')
}

// ── Main Function ──

export async function generatePhotoPrompt(
  input: PhotoPromptInput,
  userId: string | null,
  payload: Payload,
): Promise<PhotoPromptResult> {
  const apiKey = await resolveApiKey('anthropic', userId, payload)
  if (!apiKey) {
    throw new Error('No Anthropic API key configured. Set one in AI Settings → API Keys.')
  }

  let modelId = input.modelId
  if (!modelId) {
    modelId = 'claude-haiku-4-5-20251001'
  }

  const systemPrompt = buildSystemPrompt(input.detailLevel)
  const userPrompt = buildUserPrompt(input)

  payload.logger.info(`[Photo Prompt Engine] Calling ${modelId} (type: ${input.photoType}, detail: ${input.detailLevel})...`)

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

  const prompt = data.content?.[0]?.text?.trim() || ''
  const inputTokens = data.usage?.input_tokens || 0
  const outputTokens = data.usage?.output_tokens || 0

  const estimatedCost = (inputTokens * 0.00025 + outputTokens * 0.00125) / 1000

  payload.logger.info(
    `[Photo Prompt Engine] Generated ${prompt.length} chars (${inputTokens} in / ${outputTokens} out, ~$${estimatedCost.toFixed(4)})`,
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
