/**
 * Category-based pricing engine for bulk upload.
 * Base prices from the existing seed catalog + AI adjustment support.
 */

// Base prices in cents, matching existing seed catalog tiers
const BASE_PRICES: Record<string, number> = {
  Hats: 2500,
  Hoodies: 6500,
  'T-Shirts': 3500,
  Totes: 2000,
  Jackets: 8500,
  Pants: 5000,
  Accessories: 3000,
  Sets: 12000,
}

// Known product slugs with specific prices (from existing seed)
// These take priority over category defaults
const KNOWN_PRICES: Record<string, number> = {
  'icon-snapback-black': 2500,
  'icon-snapback-bone': 2500,
  'olive-dad-cap': 2500,
  'ugly-on-purpose-beanie': 2500,
  'icon-hoodie-black': 6500,
  'icon-hoodie-bone': 6500,
  'unavailable-hoodie': 6500,
  'do-not-disturb-hoodie': 6500,
  'olive-chest-logo-hoodie': 6500,
  'icon-tee-black': 3500,
  'icon-tee-white': 3500,
  'overqualified-tee': 3500,
  'error-404-tee': 3500,
  'ugly-collage-tee': 3500,
  'full-lockup-tee': 3500,
  'exit-strategy-tote': 2000,
  'cope-tote': 2000,
  'neon-psychedelic-tee': 4000,
  'harajuku-monster-tee': 4000,
  'melting-smiley-tee': 4000,
  'distressed-pink-logo-tee': 4000,
  'melting-neon-logo-tee': 4000,
  'techwear-cargo-hoodie': 7500,
  'neon-psychedelic-hoodie': 7500,
  'distressed-pink-logo-hoodie': 7500,
  'distressed-crewneck': 6500,
  'neon-psychedelic-windbreaker': 8500,
  'utility-cargo-vest': 7500,
  'distressed-bomber-jacket': 9500,
  'techwear-cargo-pants': 5500,
  'neon-psychedelic-shorts': 4500,
  'monster-face-sweatpants': 5000,
  'graffiti-messenger-bag': 3500,
  'techwear-bucket-hat': 3000,
  'neon-psychedelic-bucket-hat': 3000,
  'monster-tote-bag': 2500,
  'techwear-cargo-set': 12000,
  'neon-psychedelic-set': 13000,
}

// Categories where products have size variants
const SIZED_CATEGORIES = new Set([
  'Hoodies',
  'T-Shirts',
  'Jackets',
  'Pants',
  'Sets',
])

export type PricingResult = {
  basePrice: number // cents — from category map
  knownPrice: number | null // cents — from seed catalog (if slug matches)
  aiSuggestedPrice: number | null // cents — from AI analysis
  aiPriceReason: string | null
  finalPrice: number // cents — best available price
  hasSizeVariants: boolean
}

export function getProductPricing(
  slug: string,
  category: string,
  aiAdjustment?: { suggestedPriceAdjustment: number; priceReason: string },
): PricingResult {
  const basePrice = BASE_PRICES[category] ?? 3500 // fallback $35
  const knownPrice = KNOWN_PRICES[slug] ?? null
  const hasSizeVariants = SIZED_CATEGORIES.has(category)

  let aiSuggestedPrice: number | null = null
  let aiPriceReason: string | null = null

  if (aiAdjustment) {
    // AI suggests adjustment in dollars, convert to cents
    aiSuggestedPrice = basePrice + aiAdjustment.suggestedPriceAdjustment * 100
    aiPriceReason = aiAdjustment.priceReason
    // Clamp: never below $10, never above $200
    aiSuggestedPrice = Math.max(1000, Math.min(20000, aiSuggestedPrice))
  }

  // Priority: known seed price > AI suggestion > base category price
  const finalPrice = knownPrice ?? aiSuggestedPrice ?? basePrice

  return {
    basePrice,
    knownPrice,
    aiSuggestedPrice,
    aiPriceReason,
    finalPrice,
    hasSizeVariants,
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function titleCase(name: string): string {
  // Convert "icon-snapback-black" to "Icon Snapback Black"
  // Then apply known brand formatting
  const title = name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Apply special casing for known words
  return title
    .replace(/\bTee\b/g, 'Tee')
    .replace(/\bNeon\b/g, 'Neon')
    .replace(/\bUl\b/g, 'UL')
    .replace(/\b404\b/g, '404')
}
