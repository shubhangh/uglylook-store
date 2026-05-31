/**
 * Builds Payload CMS product documents from parsed files + AI analysis.
 */

import type { AIAnalysis } from './analyze'
import type { ParsedProduct } from './parse-files'
import { getProductPricing, slugify, titleCase } from './pricing'

export type ProductPreviewData = {
  number: string
  title: string
  slug: string
  description: string // plain text for display
  descriptionRichText: Record<string, unknown> // Lexical JSON for Payload
  category: string
  pricing: {
    basePrice: number
    knownPrice: number | null
    aiSuggestedPrice: number | null
    aiPriceReason: string | null
    finalPrice: number
  }
  hasSizeVariants: boolean
  imageCount: number
  imageFileNames: string[]
  primaryImageFileName: string
  visibleText: string
  designStyle: string
  features: string[]
  metaTitle: string
  metaDescription: string
}

function richText(text: string): Record<string, unknown> {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

function generateFallbackDescription(name: string, category: string): string {
  const title = titleCase(name)
  return `${title}. ${category} from UglyLook. Ugly is the new sick.`
}

export function buildProductPreviews(
  products: ParsedProduct[],
  analyses: Map<string, AIAnalysis | null>,
): ProductPreviewData[] {
  return products.map((product) => {
    const analysis = analyses.get(product.number) ?? null
    const slug = slugify(product.name)
    const title = titleCase(product.name)

    // Description: AI-generated or fallback
    const description =
      analysis?.description ?? generateFallbackDescription(product.name, product.category)

    // Pricing
    const pricing = getProductPricing(
      slug,
      product.category,
      analysis
        ? {
            suggestedPriceAdjustment: analysis.suggestedPriceAdjustment,
            priceReason: analysis.priceReason,
          }
        : undefined,
    )

    // SEO
    const metaTitle = `${title} | UglyLook`
    const metaDescription =
      analysis?.description ?? `${title} — ${product.category} from UglyLook. Ugly is the new sick.`

    return {
      number: product.number,
      title,
      slug,
      description,
      descriptionRichText: richText(description),
      category: product.category,
      pricing: {
        basePrice: pricing.basePrice,
        knownPrice: pricing.knownPrice,
        aiSuggestedPrice: pricing.aiSuggestedPrice,
        aiPriceReason: pricing.aiPriceReason,
        finalPrice: pricing.finalPrice,
      },
      hasSizeVariants: pricing.hasSizeVariants,
      imageCount: product.images.length,
      imageFileNames: product.images.map((img) => img.fileName),
      primaryImageFileName: product.primaryImage.fileName,
      visibleText: analysis?.visibleText ?? '',
      designStyle: analysis?.designStyle ?? '',
      features: analysis?.features ?? [],
      metaTitle,
      metaDescription,
    }
  })
}

// Re-export richText for use in confirm route
export { richText }
