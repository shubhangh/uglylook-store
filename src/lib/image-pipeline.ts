/**
 * Image Pipeline — Generates storefront images for products.
 *
 * Uses BFL API:
 *   - Flux Pro Ultra: Generate raw product photos (clean, no logo)
 *   - FLUX.2 Pro: Embed design onto product photo (multi-reference)
 *
 * Pipeline stages:
 *   Set 3 (composites): Design placed on blank using Printify specs
 *   Set 4 (editorial): Model wearing product, editorial styling
 *
 * API key resolved via AI Settings admin UI → env var fallback.
 */

import type { Payload } from 'payload'
import { resolveApiKey } from '@/lib/ai-key-encryption'

const BFL_API_BASE = 'https://api.bfl.ai/v1'

async function getBflKey(payload?: Payload): Promise<string | null> {
  if (payload) {
    return resolveApiKey('bfl', null, payload)
  }
  return process.env.BFL_API_KEY || null
}

export async function isImagePipelineConfigured(payload?: Payload): Promise<boolean> {
  return Boolean(await getBflKey(payload))
}

// ── BFL API Helpers ──

async function bflRequest(endpoint: string, body: Record<string, any>, payload?: Payload): Promise<any> {
  const key = await getBflKey(payload)
  if (!key) throw new Error('BFL API key not configured (check AI Settings or BFL_API_KEY env var)')

  const res = await fetch(`${BFL_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'X-Key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`BFL API error ${res.status}: ${text}`)
  }

  return res.json()
}

async function pollResult(jobId: string, payload?: Payload, maxWaitMs = 120_000): Promise<string> {
  const key = await getBflKey(payload)
  if (!key) throw new Error('BFL API key not configured')

  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const res = await fetch(`${BFL_API_BASE}/get_result?id=${jobId}`, {
      headers: { 'X-Key': key },
    })

    if (!res.ok) {
      await new Promise((r) => setTimeout(r, 3000))
      continue
    }

    const data = await res.json()

    if (data.status === 'Ready' && data.result?.sample) {
      return data.result.sample
    }

    if (data.status === 'Error') {
      throw new Error(`BFL job failed: ${data.error || 'Unknown error'}`)
    }

    // Still processing — wait and retry
    await new Promise((r) => setTimeout(r, 3000))
  }

  throw new Error('BFL job timed out')
}

// ── Image Generation ──

/**
 * Generate a raw product image using Flux Pro Ultra.
 * Returns the image URL from BFL.
 */
export async function generateRawProductImage(prompt: string, payload?: Payload): Promise<string> {
  const job = await bflRequest('/flux-pro-1.1-ultra', {
    prompt,
    aspect_ratio: '4:5',
    output_format: 'jpeg',
    raw: true,
    safety_tolerance: 6,
  }, payload)

  return pollResult(job.id, payload)
}

/**
 * Embed a design onto a product image using FLUX.2 Pro (multi-reference).
 *
 * @param productImageUrl — URL of the raw product photo
 * @param designImageUrl — URL of the design/logo PNG
 * @param embeddingPrompt — instructions for how to embed
 * @returns URL of the final composited image
 */
export async function embedDesignOnProduct(
  productImageUrl: string,
  designImageUrl: string,
  embeddingPrompt: string,
  payload?: Payload,
  _aiModelId?: string,
): Promise<string> {
  const designB64 = await fetchAsBase64(designImageUrl)

  // If no product base image, use design as single reference (generate from scratch)
  if (!productImageUrl) {
    const job = await bflRequest('/flux-2-pro', {
      prompt: embeddingPrompt,
      input_image: designB64,
      width: 928,
      height: 1152,
      output_format: 'jpeg',
      safety_tolerance: 5,
    }, payload)
    return pollResult(job.id, payload)
  }

  // Full multi-reference: product base + design overlay
  const productB64 = await fetchAsBase64(productImageUrl)

  const job = await bflRequest('/flux-2-pro', {
    prompt: embeddingPrompt,
    input_image: productB64,
    input_image_2: designB64,
    width: 928,
    height: 1152,
    output_format: 'jpeg',
    safety_tolerance: 5,
  }, payload)

  return pollResult(job.id, payload)
}

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`)
  const buffer = await res.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}

// ── Product Image Generation Pipeline ──

export type ImagePipelineResult = {
  rawImageUrl?: string
  compositeImageUrl?: string
  editorialImageUrls: string[]
  errors: string[]
}

/**
 * Generate all images for a product.
 *
 * @param productTitle — product name for prompt context
 * @param category — "hoodies", "tees", "hats", "totes"
 * @param designUrl — URL to the design/logo PNG file
 * @param editorialCount — number of editorial shots to generate (default 3)
 */
export async function generateProductImages(
  productTitle: string,
  category: string,
  designUrl: string,
  editorialCount = 3,
  payload?: Payload,
): Promise<ImagePipelineResult> {
  const result: ImagePipelineResult = {
    editorialImageUrls: [],
    errors: [],
  }

  if (!(await isImagePipelineConfigured(payload))) {
    result.errors.push('BFL API key not configured — skipping image generation')
    return result
  }

  if (!designUrl) {
    result.errors.push('No design URL provided — skipping image generation')
    return result
  }

  const garmentType = getGarmentType(category)

  try {
    // Step 1: Generate raw product image (no logo)
    const rawPrompt = buildRawPrompt(productTitle, garmentType, category)
    result.rawImageUrl = await generateRawProductImage(rawPrompt, payload)
  } catch (err: any) {
    result.errors.push(`Raw image generation failed: ${err.message}`)
    return result
  }

  try {
    // Step 2: Embed design onto raw image
    const embedPrompt = buildEmbedPrompt(garmentType, category)
    result.compositeImageUrl = await embedDesignOnProduct(
      result.rawImageUrl!,
      designUrl,
      embedPrompt,
      payload,
    )
  } catch (err: any) {
    result.errors.push(`Design embedding failed: ${err.message}`)
    return result
  }

  // Step 3: Generate editorial shots (using composite as reference)
  for (let i = 0; i < editorialCount; i++) {
    try {
      const angle = ['front-facing hero shot', 'three-quarter angle', 'detail close-up'][i] || 'lifestyle shot'
      const editorialPrompt = buildEditorialPrompt(productTitle, garmentType, angle)
      const url = await generateRawProductImage(editorialPrompt, payload)
      result.editorialImageUrls.push(url)
    } catch (err: any) {
      result.errors.push(`Editorial shot ${i + 1} failed: ${err.message}`)
    }
  }

  return result
}

// ── Prompt Builders ──

function getGarmentType(category: string): string {
  const map: Record<string, string> = {
    hoodies: 'heavyweight hoodie',
    tees: 'cotton t-shirt',
    hats: 'snapback cap',
    totes: 'canvas tote bag',
    sweatshirts: 'crewneck sweatshirt',
  }
  return map[category] || 'garment'
}

function buildRawPrompt(title: string, garmentType: string, category: string): string {
  const isAccessory = category === 'hats' || category === 'totes'

  if (isAccessory) {
    return `Editorial streetwear product photography for UglyLook brand. A black ${garmentType} on a raw concrete surface. Clean, no logos, no text, no graphics on the product. Soft studio lighting, matte finish, no gloss. Near-black background #111111. Shot on Hasselblad X2D, 120mm lens. 4:5 aspect ratio. No person names, no gibberish text.`
  }

  return `Editorial streetwear catalog photography for UglyLook brand. A model wearing a black ${garmentType}, clean empty chest area with no logos, no text, no graphics on the garment. Model has confident deadpan expression, arms at sides, chest fully visible. Matte finish fabric, no gloss. Cream background #F5F2EC. Bright studio lighting. Full body shot head to toe. Shot on Hasselblad X2D, 80mm lens. 4:5 aspect ratio. No person names, no gibberish text, no crossed arms.`
}

function buildEmbedPrompt(garmentType: string, category: string): string {
  if (category === 'hats') {
    return `Product photo editing task. Take the first reference image (a cap) and apply the icon from the second reference image as an embroidered patch on the front panel. The icon is a rounded-corner square with a stylized asymmetric U lettermark inside. Reproduce the icon EXACTLY as shown in the second reference image. The patch should look genuinely sewn on, following the cap curvature. Approximately 5-6cm wide, centered on front panel. Keep everything else unchanged. Output only the edited photo, no banners, no duplication.`
  }

  if (category === 'totes') {
    return `Product photo editing task. Take the first reference image (a bag) and screen-print the logo from the second reference image onto the center front. The logo has a rounded-corner square icon with a stylized U lettermark on the left and the word UglyLook on the right. Reproduce the logo EXACTLY as shown. The print should look natural on the fabric with texture visible. Centered, approximately 18cm wide. Keep everything else unchanged. Output only the edited photo, no banners, no duplication.`
  }

  return `Product photo editing task. Take the first reference image and screen-print the logo from the second reference image onto the center chest of the garment. The logo has a rounded-corner square icon with a stylized U lettermark on the left and the word UglyLook on the right, in cream-white, arranged horizontally. Reproduce the logo EXACTLY as shown in the second reference image — same shapes, same proportions, same typography. The print should look natural on matte fabric with texture visible through the ink. Centered on chest approximately 22-25cm wide. Keep everything else unchanged — model, pose, background, lighting. Output only the edited photo, no banners, no duplication.`
}

function buildEditorialPrompt(title: string, garmentType: string, angle: string): string {
  return `Editorial streetwear catalog photography for UglyLook brand. ${angle}. A model wearing a black ${garmentType} with the UglyLook logo screen-printed on the center chest — a rounded-corner square icon with a stylized U next to the word UglyLook in cream-white. Confident deadpan expression. Matte finish, no gloss. Near-black background. Bright studio lighting with soft fill. Full body shot. Shot on Hasselblad X2D. 4:5 aspect ratio. No person names, no gibberish text, no crossed arms.`
}
