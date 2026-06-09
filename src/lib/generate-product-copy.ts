/**
 * AI Product Copy Generator — uses Gemini to auto-generate
 * product title, description, features, and tags.
 *
 * Sends design image + product image + mockup to Gemini for visual analysis,
 * along with design metadata. Gemini sees what the design actually looks like
 * and what the product is, rather than relying solely on metadata titles.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { resolveApiKey } from '@/lib/ai-key-encryption'
import type { Payload } from 'payload'

export type ProductCopy = {
  title: string
  description: string
  features: string[]
  tags: string[]
  suggestedPrice: number
}

type DesignContext = {
  designTitle: string
  designLane?: string
  emotionTier?: string
  emotionPrimary?: string
  printText?: string
  type?: string
  forCategories?: string[]
  blueprintTitle?: string
}

type ImageInput = {
  buffer: Buffer
  mimeType: string
  label: string
}

const SYSTEM_PROMPT = `You are a copywriter for UglyLook, a Gen Z streetwear brand. Tagline: "Ugly is the new sick."

Your voice: dry, deadpan, adult humor. Short sentences. Never explain the joke. No enthusiasm. No exclamation marks.

You will receive:
- Images: the design file (what gets printed), the product photo (the blank garment from Printify), and optionally a mockup (design on the garment)
- Metadata: design title (may be a placeholder/test name — IGNORE it for naming if it looks like a test), print text, style lane, garment info, Printify product name

IMPORTANT: Look at the actual images to understand:
1. What the design visually contains (text, graphics, patterns, logos)
2. What the garment looks like (hoodie, tee, hat, etc.)
3. The overall vibe and aesthetic

Base your title and description on what you SEE in the images, not on the design title metadata (which may be a test name like "test-1" or "approved-test").

Return ONLY a valid JSON object:

{
  "title": "Product title. Max 60 chars. Format: '[Design element] [Garment]'. If the design has text on it, use that text. If it's a graphic/logo, describe it briefly. Examples: 'ERROR 404 Heavyweight Hoodie', 'Skull Icon Snapback', 'Glitch Pattern Tee'. Never use test names or placeholder names.",
  "description": "1-2 sentences max in UglyLook deadpan voice. Reference what you SEE on the design. Examples: 'Says what your therapist won't. Heavyweight cotton for when you need emotional support.' / 'For people who peaked in the loading screen.' / 'Stains easily. We know.'",
  "features": ["3-4 product features. Mix garment specs with tongue-in-cheek copy. Examples: 'oversized fit', 'front chest print', 'heavyweight 300gsm cotton', 'pairs well with regret'"],
  "tags": ["5-8 lowercase tags for search/SEO. Mix category, style, design, mood. Examples: 'hoodie', 'streetwear', 'text-print', 'ironic', 'oversized', 'black', 'statement-piece'"],
  "suggestedPrice": 0
}

Price guidelines (USD):
- Tees: 38-48 (base 42)
- Hoodies: 68-82 (base 72)
- Hats: 32-38 (base 34)
- Totes: 28-34 (base 30)
- Sweatshirts: 58-72 (base 64)
Add $5-10 for premium designs (all-over, multi-color, Tier A flagship).

Rules:
- The title MUST be based on what you SEE in the design image, not on metadata titles
- The description MUST be deadpan. No "perfect for", no "elevate your", no marketing fluff
- If you can read text in the design image, use that text in the title
- Return ONLY valid JSON, no markdown fencing`

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite']

async function getClient(userId: string | null, payload: Payload): Promise<GoogleGenerativeAI | null> {
  const key = await resolveApiKey('gemini', userId, payload)
  if (!key) return null
  return new GoogleGenerativeAI(key)
}

/**
 * Generate product copy from design + product images + metadata.
 */
export async function generateProductCopy(
  designContext: DesignContext,
  garmentType: string,
  category: string,
  userId: string | null,
  payload: Payload,
  images?: ImageInput[],
): Promise<ProductCopy | null> {
  const client = await getClient(userId, payload)
  if (!client) {
    payload.logger.warn('[Copy Gen] No Gemini API key configured')
    return null
  }

  const contextLines = [
    `Design metadata title: "${designContext.designTitle}" (NOTE: may be a test/placeholder name — look at the actual image instead)`,
    designContext.printText ? `Text on design: "${designContext.printText}"` : null,
    designContext.type ? `Design type: ${designContext.type}` : null,
    designContext.designLane ? `Style lane: ${designContext.designLane}` : null,
    designContext.emotionTier ? `Tier: ${designContext.emotionTier}` : null,
    designContext.emotionPrimary ? `Emotion: ${designContext.emotionPrimary}` : null,
    `Garment: ${garmentType}`,
    `Category: ${category}`,
    designContext.blueprintTitle ? `Printify product: ${designContext.blueprintTitle}` : null,
    (designContext as any).productDetails ? `\nProduct details:\n${(designContext as any).productDetails}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  // Build image labels for context
  const imageLabels = (images || []).map((img) => {
    if (img.label === 'design') return 'Image 1: The design/print file (what gets printed on the garment)'
    if (img.label === 'product') return 'Image 2: The blank product photo from Printify (the garment itself)'
    if (img.label === 'mockup') return 'Image 3: A mockup showing the design on the product'
    return `Image: ${img.label}`
  }).join('\n')

  const userPrompt = `${SYSTEM_PROMPT}\n\n--- Images Provided ---\n${imageLabels || 'No images provided — use metadata only.'}\n\n--- Design & Garment Metadata ---\n${contextLines}\n\nLook at the images carefully, then generate the product copy JSON.`

  for (const modelName of MODELS) {
    try {
      const model = client.getGenerativeModel({ model: modelName })

      const parts: any[] = []

      // Add all images
      if (images?.length) {
        for (const img of images) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.buffer.toString('base64'),
            },
          })
        }
      }

      parts.push({ text: userPrompt })

      const result = await model.generateContent(parts)
      const responseText = result.response.text().trim()

      const cleaned = responseText
        .replace(/^```json?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()

      const parsed = JSON.parse(cleaned) as ProductCopy

      if (!parsed.title || !parsed.description) {
        throw new Error('Missing required fields in AI response')
      }

      payload.logger.info(`[Copy Gen] Generated copy via ${modelName} — title: "${parsed.title}"`)
      return parsed
    } catch (err) {
      payload.logger.warn(
        `[Copy Gen] ${modelName} failed: ${err instanceof Error ? err.message : err}`,
      )
      continue
    }
  }

  payload.logger.warn(`[Copy Gen] All models failed for "${designContext.designTitle}"`)
  return null
}
