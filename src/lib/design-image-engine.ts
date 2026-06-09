/**
 * Design Image Generation Engine — Multi-model orchestration.
 *
 * Supports:
 *   - FLUX 2.0 Pro (BFL) — default, best quality
 *   - Gemini 2.5 Flash (Google) — cheapest, draft mode
 *   - GPT Image 1 (OpenAI) — creative/artistic
 *
 * Each model has its own API client. The engine resolves keys,
 * picks the model, generates images, and returns base64 results.
 */

import { resolveApiKey } from '@/lib/ai-key-encryption'
import { updateGenerationProgress } from '@/lib/design-generation-queue'
import { compositeTextDesign } from '@/lib/text-compositor'
import { getPaletteById } from '@/lib/gen-z-palettes'
import type { Payload } from 'payload'

// ── Types ──

export type GeneratedImage = {
  id: string
  base64: string
  mimeType: string
  prompt: string
  model: string
  modelDisplayName: string
  index: number
  costPerImage: number
}

export type GenerationResult = {
  images: GeneratedImage[]
  model: string
  modelDisplayName: string
  totalCost: number
  durationMs: number
  errors: string[]
}

// ── Provider Map ──

const MODEL_PROVIDER_MAP: Record<string, string> = {
  'flux-2-pro': 'bfl',
  'flux-pro-1.1-ultra': 'bfl',
  'gemini-2.5-flash-image': 'gemini',
  'gemini-3-pro-image': 'gemini',
  'gemini-3.1-flash-image': 'gemini',
  'gpt-image-1': 'openai',
}

// ── Main Function ──

/**
 * Generate images using the specified model.
 *
 * @param prompts — array of prompts (one per image)
 * @param modelId — model ID from registry
 * @param userId — current user (for key resolution)
 * @param payload — Payload instance
 */
export async function generateImages(
  prompts: string[],
  modelId: string,
  userId: string | null,
  payload: Payload,
  referenceImageUrl?: string,
): Promise<GenerationResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const images: GeneratedImage[] = []

  // Resolve provider from model ID
  let provider = MODEL_PROVIDER_MAP[modelId]

  // If not in static map, look up from registry
  if (!provider) {
    try {
      const models = await payload.find({
        collection: 'ai-model-registry' as any,
        where: { modelId: { equals: modelId } },
        limit: 1,
        depth: 0,
      })
      const model = models.docs[0] as any
      if (model) provider = model.provider
    } catch { /* */ }
  }

  if (!provider) {
    throw new Error(`Unknown model: ${modelId}. Not found in registry.`)
  }

  // Resolve API key
  const apiKey = await resolveApiKey(provider as any, userId, payload)
  if (!apiKey) {
    throw new Error(`No ${provider} API key configured. Set one in AI Settings.`)
  }

  // Get model display name + cost from registry
  let displayName = modelId
  let costPerImage = 0
  try {
    const models = await payload.find({
      collection: 'ai-model-registry' as any,
      where: { modelId: { equals: modelId } },
      limit: 1,
      depth: 0,
    })
    const model = models.docs[0] as any
    if (model) {
      displayName = model.displayName || modelId
      costPerImage = model.costPerImage || 0
    }
  } catch { /* */ }

  payload.logger.info(
    `[Image Engine] Generating ${prompts.length} images with ${displayName}...`,
  )

  // Generate based on provider
  for (let i = 0; i < prompts.length; i++) {
    try {
      let base64: string
      let mimeType: string

      switch (provider) {
        case 'bfl':
          ;({ base64, mimeType } = await generateWithFlux(prompts[i], modelId, apiKey))
          break
        case 'gemini':
          ;({ base64, mimeType } = await generateWithGemini(prompts[i], modelId, apiKey, referenceImageUrl))
          break
        case 'openai':
          ;({ base64, mimeType } = await generateWithOpenAI(prompts[i], apiKey, referenceImageUrl))
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }

      images.push({
        id: `img_${Date.now()}_${i}`,
        base64,
        mimeType,
        prompt: prompts[i],
        model: modelId,
        modelDisplayName: displayName,
        index: i,
        costPerImage,
      })

      payload.logger.info(`[Image Engine] Generated image ${i + 1}/${prompts.length}`)

      // Update in-memory progress for polling
      updateGenerationProgress({
        completed: images.length,
        currentIndex: i + 1,
        costSoFar: images.length * costPerImage,
      })
    } catch (err: any) {
      errors.push(`Image ${i + 1} failed: ${err.message}`)
      payload.logger.error(`[Image Engine] Image ${i + 1} failed: ${err.message}`)

      updateGenerationProgress({
        completed: images.length,
        failed: errors.length,
        currentIndex: i + 1,
        costSoFar: images.length * costPerImage,
      })
    }
  }

  const durationMs = Date.now() - startTime
  const totalCost = images.length * costPerImage

  payload.logger.info(
    `[Image Engine] Done: ${images.length}/${prompts.length} images in ${Math.round(durationMs / 1000)}s. Cost: $${totalCost.toFixed(3)}`,
  )

  return {
    images,
    model: modelId,
    modelDisplayName: displayName,
    totalCost,
    durationMs,
    errors,
  }
}

// ── FLUX 2.0 Pro (BFL) ──

async function generateWithFlux(
  prompt: string,
  modelId: string,
  apiKey: string,
): Promise<{ base64: string; mimeType: string }> {
  // Map model IDs to BFL API endpoints
  const endpointMap: Record<string, string> = {
    'flux-2-pro': '/v1/flux-2-pro',
    'flux-pro-1.1-ultra': '/v1/flux-pro-1.1-ultra',
  }
  const endpoint = endpointMap[modelId] || '/v1/flux-2-pro'

  // Submit job
  const submitRes = await fetch(`https://api.bfl.ai${endpoint}`, {
    method: 'POST',
    headers: {
      'X-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 1024,
      output_format: 'png',
      safety_tolerance: 5,
    }),
  })

  if (!submitRes.ok) {
    const text = await submitRes.text()
    throw new Error(`BFL submit error ${submitRes.status}: ${text}`)
  }

  const { id: jobId } = await submitRes.json()

  // Poll for result
  const maxWaitMs = 120_000
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 3000))

    const pollRes = await fetch(`https://api.bfl.ai/v1/get_result?id=${jobId}`, {
      headers: { 'X-Key': apiKey },
    })

    if (!pollRes.ok) continue

    const data = await pollRes.json()

    if (data.status === 'Ready' && data.result?.sample) {
      // Download the image and convert to base64
      const imgRes = await fetch(data.result.sample)
      if (!imgRes.ok) throw new Error('Failed to download generated image')
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      return { base64: buffer.toString('base64'), mimeType: 'image/png' }
    }

    if (data.status === 'Error') {
      throw new Error(`BFL job failed: ${data.error || 'Unknown'}`)
    }
  }

  throw new Error('BFL job timed out after 120s')
}

// ── Gemini (Google) ──

async function generateWithGemini(
  prompt: string,
  modelId: string,
  apiKey: string,
  referenceImageUrl?: string,
): Promise<{ base64: string; mimeType: string }> {
  const model = modelId || 'gemini-2.5-flash-image'

  // Build parts — text prompt + optional reference image
  const parts: any[] = []
  if (referenceImageUrl) {
    try {
      const imgRes = await fetch(referenceImageUrl)
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer())
        const mime = imgRes.headers.get('content-type') || 'image/png'
        parts.push({
          inlineData: { mimeType: mime, data: buffer.toString('base64') },
        })
        parts.push({
          text: `REFERENCE IMAGE: The person in this reference image is the model. Generate a NEW photo of this SAME person (same face, same body, same skin tone, same hair) in the pose/angle described below. The model must look identical to the reference.\n\n${prompt}`,
        })
      } else {
        parts.push({ text: prompt })
      }
    } catch {
      parts.push({ text: prompt })
    }
  } else {
    parts.push({ text: prompt })
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      }),
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini error ${res.status}: ${text}`)
  }

  const data = await res.json()

  // Find image part in response
  const responseParts = data.candidates?.[0]?.content?.parts || []
  const imagePart = responseParts.find(
    (p: any) => p.inlineData?.mimeType?.startsWith('image/'),
  )

  if (!imagePart?.inlineData) {
    throw new Error('No image in Gemini response')
  }

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  }
}

// ── GPT Image 1 (OpenAI) ──

async function generateWithOpenAI(
  prompt: string,
  apiKey: string,
  referenceImageUrl?: string,
): Promise<{ base64: string; mimeType: string }> {
  // GPT Image 1 doesn't support image input via generations endpoint.
  // If reference provided, prepend a strong consistency instruction to the text prompt.
  const effectivePrompt = referenceImageUrl
    ? `IMPORTANT: Generate an image of a model who looks IDENTICAL to the person in this reference photo: ${referenceImageUrl}. Same face, same skin tone, same hair, same body type. The model must be recognizably the same person.\n\n${prompt}`
    : prompt

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: effectivePrompt,
      n: 1,
      size: '1024x1024',
      output_format: 'png',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const imageData = data.data?.[0]?.b64_json || data.data?.[0]?.b64

  if (!imageData) {
    throw new Error('No image data in OpenAI response')
  }

  return { base64: imageData, mimeType: 'image/png' }
}

// ── Text Compositing ──

export type TextCompositeConfig = {
  heroText: string
  subText?: string
  paletteId: string
  position: 'bottom-left' | 'center' | 'bottom-center'
  garmentColor: 'dark' | 'light'
  heroFont?: string
  heroWeight?: number
  subFont?: string
  subWeight?: number
}

/**
 * Composite text over generated images using Satori + resvg-js + Sharp.
 * Returns new images with composited text + original raw images.
 */
export async function compositeTextOnImages(
  images: GeneratedImage[],
  textConfig: TextCompositeConfig,
  payload: Payload,
): Promise<{ composited: GeneratedImage[]; rawGraphics: GeneratedImage[] }> {
  const palette = getPaletteById(textConfig.paletteId)
  if (!palette) throw new Error(`Unknown palette: ${textConfig.paletteId}`)

  const composited: GeneratedImage[] = []
  const rawGraphics: GeneratedImage[] = []

  for (const img of images) {
    // Keep raw graphic reference
    rawGraphics.push({ ...img })

    try {
      const graphicBuffer = Buffer.from(img.base64, 'base64')

      // Detect image dimensions (default 1024x1024)
      let width = 1024
      let height = 1024
      try {
        const sharp = (await import('sharp')).default
        const metadata = await sharp(graphicBuffer).metadata()
        if (metadata.width) width = metadata.width
        if (metadata.height) height = metadata.height
      } catch { /* use defaults */ }

      const result = await compositeTextDesign({
        graphicBuffer,
        width,
        height,
        heroText: textConfig.heroText,
        subText: textConfig.subText,
        palette,
        position: textConfig.position,
        garmentColor: textConfig.garmentColor,
        heroFont: textConfig.heroFont,
        heroWeight: textConfig.heroWeight,
        subFont: textConfig.subFont,
        subWeight: textConfig.subWeight,
      })

      composited.push({
        ...img,
        id: `comp_${img.id}`,
        base64: result.buffer.toString('base64'),
        mimeType: result.mimeType,
      })

      payload.logger.info(`[Image Engine] Composited text on image ${img.index + 1}`)
    } catch (err: any) {
      payload.logger.error(`[Image Engine] Text composite failed for image ${img.index + 1}: ${err.message}`)
      // Fall back to raw image
      composited.push({ ...img })
    }
  }

  return { composited, rawGraphics }
}

// ── Helpers ──

/**
 * Get available image models from registry.
 */
export async function getAvailableImageModels(payload: Payload) {
  const models = await payload.find({
    collection: 'ai-model-registry' as any,
    where: {
      modelType: { in: ['image', 'image-edit'] },
      isEnabled: { equals: true },
    },
    sort: 'family',
    depth: 0,
  })

  const families: Record<string, any[]> = {}
  for (const model of models.docs) {
    const m = model as any
    if (!families[m.family]) families[m.family] = []
    families[m.family].push({
      id: m.id,
      modelId: m.modelId,
      displayName: m.displayName,
      version: m.version,
      tag: m.tag,
      isDefault: m.isDefault,
      costPerImage: m.costPerImage,
      provider: m.provider,
      modelType: m.modelType,
      shortDescription: m.shortDescription || '',
    })
  }

  return families
}
