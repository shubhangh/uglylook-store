/**
 * Gemini Vision analysis for product images.
 * Primary: Gemini 2.5 Flash. Fallback: Gemini 2.0 Flash Lite.
 * Results cached in MongoDB with up to 5 versions per image.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import crypto from 'crypto'
import type { Payload } from 'payload'
import { resolveApiKey } from '@/lib/ai-key-encryption'

export type AIAnalysis = {
  visibleText: string
  productType: string
  primaryColor: string
  designStyle: string
  description: string
  features: string[]
  suggestedPriceAdjustment: number
  priceReason: string
}

export type CachedVersion = {
  id: string
  version: number
  analysis: AIAnalysis
  model: string
  createdAt: string
}

const MAX_VERSIONS = 5

const SYSTEM_PROMPT = `You are a product analyst for UglyLook, a Gen Z streetwear brand. Tagline: "Ugly is the new sick."

Analyze the product image and return a JSON object with these exact fields:

{
  "visibleText": "Any text printed/visible on the garment (exact text, ALL CAPS if that's how it appears). Empty string if none.",
  "productType": "The type of garment: tee, hoodie, snapback, beanie, dad cap, tote, windbreaker, vest, bomber, pants, shorts, sweatpants, messenger bag, bucket hat, crewneck, set",
  "primaryColor": "The dominant color of the garment",
  "designStyle": "Brief style description: e.g. 'text-based statement piece', 'all-over neon print', 'minimal logo placement', 'distressed/splatter graphic'",
  "description": "Write a product description in UglyLook's voice: dry, deadpan, adult humor. 1-2 sentences max. If there's visible text on the product, weave it into the description. Never explain the joke. Examples of the brand voice: 'Covers the part of your head you're insecure about.' / 'Stains easily. We know.' / 'More storage than your apartment. Less rent.'",
  "features": ["List 2-4 product features like 'oversized fit', 'front text print', 'heavyweight cotton', 'all-over print', 'cargo pockets'"],
  "suggestedPriceAdjustment": 0,
  "priceReason": "Reason for price adjustment from base. 0 means standard for category. +5 to +15 for premium features (all-over print, cargo details, multi-piece set). -5 for simpler items."
}

Rules:
- The description MUST be in UglyLook's deadpan voice. Short. Dry. No enthusiasm.
- If you see text on the garment, include it in the description naturally.
- suggestedPriceAdjustment is in dollars (not cents). Use 0 for standard items.
- Return ONLY valid JSON, no markdown fencing, no explanation.`

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite']

async function getClient(payload?: Payload): Promise<GoogleGenerativeAI | null> {
  const key = payload
    ? await resolveApiKey('gemini', null, payload)
    : process.env.GOOGLE_AI_API_KEY || null
  if (!key) return null
  return new GoogleGenerativeAI(key)
}

export function hashImage(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Get all cached versions for an image hash, sorted newest first.
 */
async function getCachedVersions(
  payload: Payload,
  imageHash: string,
): Promise<CachedVersion[]> {
  try {
    const result = await payload.find({
      collection: 'ai-product-analysis-cache' as any,
      where: { imageHash: { equals: imageHash } },
      sort: '-createdAt',
      limit: MAX_VERSIONS,
    })
    return result.docs.map((doc: any) => ({
      id: doc.id,
      version: doc.version,
      analysis: doc.analysis as AIAnalysis,
      model: doc.model,
      createdAt: doc.createdAt,
    }))
  } catch {
    return []
  }
}

/**
 * Get the latest cached analysis for an image hash.
 */
async function getLatestCachedAnalysis(
  payload: Payload,
  imageHash: string,
): Promise<AIAnalysis | null> {
  const versions = await getCachedVersions(payload, imageHash)
  return versions.length > 0 ? versions[0].analysis : null
}

/**
 * Save a new analysis version. Prunes oldest if > MAX_VERSIONS.
 */
async function saveAnalysisVersion(
  payload: Payload,
  imageHash: string,
  analysis: AIAnalysis,
  productName: string,
  category: string,
  model: string,
): Promise<void> {
  try {
    // Get existing versions to determine next version number
    const existing = await getCachedVersions(payload, imageHash)
    const nextVersion = existing.length > 0 ? Math.max(...existing.map((v) => v.version)) + 1 : 1

    // Create new version
    await payload.create({
      collection: 'ai-product-analysis-cache' as any,
      data: {
        imageHash,
        version: nextVersion,
        productName,
        category,
        model,
        analysis,
      } as any,
    })

    // Prune oldest versions if we exceed MAX_VERSIONS
    if (existing.length >= MAX_VERSIONS) {
      const toDelete = existing.slice(MAX_VERSIONS - 1)
      for (const old of toDelete) {
        try {
          await payload.delete({
            collection: 'ai-product-analysis-cache' as any,
            id: old.id,
          })

        } catch {
          // Non-critical
        }
      }
    }
  } catch (err) {
    console.error(`[bulk-upload] Failed to save cache for "${productName}":`, err)
  }
}

async function callGemini(
  imageBuffer: Buffer,
  mimeType: string,
  productName: string,
  category: string,
  payload?: Payload,
): Promise<{ analysis: AIAnalysis; model: string } | null> {
  const client = await getClient(payload)
  if (!client) {
    console.warn('[bulk-upload] No Gemini API key configured (checked AI Settings + env)')
    return null
  }

  const imageData = imageBuffer.toString('base64')

  for (const modelName of MODELS) {
    try {
      const model = client.getGenerativeModel({ model: modelName })

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: imageData,
          },
        },
        {
          text: `${SYSTEM_PROMPT}\n\nProduct context: This is a "${productName}" in the "${category}" category. Analyze the image and return the JSON.`,
        },
      ])

      const responseText = result.response.text().trim()

      const cleaned = responseText
        .replace(/^```json?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      const parsed = JSON.parse(cleaned) as AIAnalysis

      if (!parsed.description || !parsed.productType) {
        throw new Error('Missing required fields in AI response')
      }

      return { analysis: parsed, model: modelName }
    } catch (err) {
      console.warn(
        `[bulk-upload] ${modelName} failed for "${productName}":`,
        err instanceof Error ? err.message : err,
      )
      continue
    }
  }

  console.warn(`[bulk-upload] All Gemini models failed for "${productName}", using fallback`)
  return null
}

export async function analyzeProductImage(
  imageBuffer: Buffer,
  mimeType: string,
  productName: string,
  category: string,
  payload?: Payload,
  forceReanalyze?: boolean,
): Promise<AIAnalysis | null> {
  const imageHash = hashImage(imageBuffer)

  // Check cache first (unless forced re-analyze)
  if (payload && !forceReanalyze) {
    const cached = await getLatestCachedAnalysis(payload, imageHash)
    if (cached) {
      return cached
    }
  }

  // Cache miss or forced — call Gemini
  const result = await callGemini(imageBuffer, mimeType, productName, category, payload)

  if (result && payload) {
    await saveAnalysisVersion(payload, imageHash, result.analysis, productName, category, result.model)
  }

  return result?.analysis ?? null
}

/**
 * Analyze multiple products with rate limiting and caching.
 */
export async function analyzeProducts(
  products: Array<{
    number: string
    name: string
    category: string
    imageBuffer: Buffer
    mimeType: string
  }>,
  payload?: Payload,
  forceReanalyze?: boolean,
  onProgress?: (current: number, total: number, productName: string) => void,
): Promise<Map<string, AIAnalysis | null>> {
  const results = new Map<string, AIAnalysis | null>()

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    onProgress?.(i + 1, products.length, product.name)

    const analysis = await analyzeProductImage(
      product.imageBuffer,
      product.mimeType,
      product.name,
      product.category,
      payload,
      forceReanalyze,
    )

    results.set(product.number, analysis)

    // Rate limit between API calls
    if (i < products.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return results
}

// Re-export for check-cache endpoint
export { getCachedVersions }
