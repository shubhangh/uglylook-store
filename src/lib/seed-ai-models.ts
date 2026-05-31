/**
 * Seeds the AI Model Registry with known models on first boot.
 * Only runs if the registry is empty.
 */

import type { Payload } from 'payload'

const SEED_MODELS = [
  // ── Prompt Models (Anthropic) ──
  {
    modelId: 'claude-haiku-4-5-20251001',
    displayName: 'Claude Haiku 4.5',
    family: 'Claude Haiku',
    version: '4.5',
    provider: 'anthropic',
    modelType: 'prompt',
    tag: 'fast',
    costPer1kInputTokens: 0.001,
    costPer1kOutputTokens: 0.005,
    isDefault: true,
    source: 'manual',
  },
  {
    modelId: 'claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    family: 'Claude Sonnet',
    version: '4.6',
    provider: 'anthropic',
    modelType: 'prompt',
    tag: 'better',
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    source: 'manual',
  },
  {
    modelId: 'claude-opus-4-6',
    displayName: 'Claude Opus 4.6',
    family: 'Claude Opus',
    version: '4.6',
    provider: 'anthropic',
    modelType: 'prompt',
    tag: 'best',
    costPer1kInputTokens: 0.015,
    costPer1kOutputTokens: 0.075,
    source: 'manual',
  },

  // ── Image Models ──
  {
    modelId: 'flux-2-pro',
    displayName: 'FLUX 2.0 Pro',
    family: 'FLUX',
    version: '2.0 Pro',
    provider: 'bfl',
    modelType: 'image',
    tag: 'default',
    costPerImage: 0.075,
    isDefault: true,
    source: 'manual',
  },
  {
    modelId: 'flux-pro-1.1-ultra',
    displayName: 'Flux Pro 1.1 Ultra',
    family: 'FLUX',
    version: '1.1 Ultra',
    provider: 'bfl',
    modelType: 'image',
    costPerImage: 0.04,
    source: 'manual',
    notes: 'Best for full scenes with models (Set 4 editorial). Not needed for standalone designs.',
  },
  {
    modelId: 'gemini-2.5-flash-image',
    displayName: 'Gemini 2.5 Flash Image',
    family: 'Gemini',
    version: '2.5 Flash',
    provider: 'gemini',
    modelType: 'image',
    tag: 'draft',
    costPerImage: 0.002,
    shortDescription: 'Fast and cheap draft generation. Good for exploring ideas quickly.',
    source: 'manual',
    notes: 'Cheapest option. Good for rapid draft/concept exploration.',
  },
  {
    modelId: 'gemini-3-pro-image',
    displayName: 'Gemini 3 Pro Image',
    family: 'Gemini',
    version: '3.0 Pro',
    provider: 'gemini',
    modelType: 'image',
    tag: 'best',
    costPerImage: 0.02,
    shortDescription: 'Flagship quality. Industry-leading text rendering, native 1K with 2K/4K upscaling, physics-aware lighting.',
    source: 'manual',
    notes: 'Codename: Nano Banana Pro. Best Gemini image model.',
  },
  {
    modelId: 'gemini-3.1-flash-image',
    displayName: 'Gemini 3.1 Flash Image',
    family: 'Gemini',
    version: '3.1 Flash',
    provider: 'gemini',
    modelType: 'image',
    tag: 'fast',
    costPerImage: 0.003,
    shortDescription: 'Latest flash-tier image model. Fast drafts with improved quality over 2.5 Flash.',
    source: 'manual',
    notes: 'Codename: Nano Banana 2. Replaces 2.5 Flash for drafts.',
  },
  {
    modelId: 'gpt-image-1',
    displayName: 'GPT Image 1',
    family: 'GPT Image',
    version: '1',
    provider: 'openai',
    modelType: 'image',
    tag: 'creative',
    costPerImage: 0.08,
    shortDescription: 'Creative and artistic output. Strong at stylized, illustrative designs.',
    source: 'manual',
    notes: 'Best for artistic/creative designs and image editing. Supports image-to-image.',
  },
]

export async function seedAIModels(payload: Payload): Promise<void> {
  try {
    const existing = await payload.count({
      collection: 'ai-model-registry' as any,
    })

    if (existing.totalDocs > 0) {
      return // Already seeded
    }

    payload.logger.info('[AI Models] Seeding model registry...')

    for (const model of SEED_MODELS) {
      await payload.create({
        collection: 'ai-model-registry' as any,
        data: model as any,
      })
    }

    payload.logger.info(`[AI Models] Seeded ${SEED_MODELS.length} models`)
  } catch (err: any) {
    payload.logger.error(`[AI Models] Seed failed: ${err.message}`)
  }
}
