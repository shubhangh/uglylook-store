/**
 * SKU Scoring Engine for UglyLook Printify Catalog Browser.
 *
 * Scores each blueprint × provider combination against weighted criteria
 * to help the owner quickly find the best blanks for the brand.
 */

// UglyLook brand colors (approximate matches in Printify color names)
const BRAND_COLORS: Record<string, string[]> = {
  black: ['black', 'jet black', 'deep black'],
  bone: ['bone', 'sand', 'natural', 'cream', 'ivory', 'oatmeal', 'heather dust', 'soft cream'],
  white: ['white', 'vintage white'],
  olive: ['olive', 'military green', 'army', 'dark green', 'forest green'],
  charcoal: ['charcoal', 'dark heather', 'dark grey', 'charcoal heather'],
}

// Premium streetwear blank brands (higher quality = higher score)
const PREMIUM_BRANDS = [
  'bella+canvas', 'bella canvas', 'comfort colors', 'independent trading',
  'champion', 'as colour', 'next level', 'los angeles apparel',
  'american apparel', 'stanley/stella',
]

const GOOD_BRANDS = [
  'gildan', 'hanes', 'jerzees', 'port & company', 'fruit of the loom',
]

// Target retail prices for margin calculation
const TARGET_RETAIL: Record<string, number> = {
  hoodies: 72,
  tees: 38,
  hats: 35,
  totes: 28,
  sweatshirts: 58,
  jackets: 85,
  pants: 55,
  default: 45,
}

// Stripe fee: 2.9% + $0.30
function stripeFee(retail: number): number {
  return retail * 0.029 + 0.30
}

export interface ParsedVariant {
  variantId: number
  title: string
  color: string
  size: string
  cost: number       // in cents (raw from Printify)
  costDollars: number // in dollars
  isEnabled: boolean
  isAvailable: boolean
  options: Record<string, any>
}

export interface ScoredSku {
  blueprintId: number
  blueprintTitle: string
  blueprintBrand: string
  blueprintModel: string
  blueprintImages: string[]
  providerId: number
  providerTitle: string
  decorationMethods: { id: number; title: string }[]
  category: string
  // Cost data
  minCost: number // cheapest variant cost in dollars
  maxCost: number // most expensive variant cost in dollars
  shippingCostUs: number // first item US shipping in dollars
  handlingTime: string
  // Margin at target retail
  targetRetail: number
  marginPercent: number
  profitPerUnit: number
  // Availability
  totalVariants: number
  enabledVariants: number
  availableColors: string[]
  brandColorsAvailable: string[] // which UglyLook brand colors are available
  brandColorCount: number
  availableSizes: string[]
  sizeRange: string // e.g. "S - 3XL"
  hasSizeS: boolean
  hasSizeM: boolean
  hasSizeL: boolean
  hasSizeXL: boolean
  hasSize2XL: boolean
  // Print area
  printAreaFront: { width: number; height: number } | null
  printAreaBack: { width: number; height: number } | null
  printAreaCount: number
  // Provider
  isUsProvider: boolean
  // Full variant data
  variants: ParsedVariant[]
  // Score
  score: number
  scoreBreakdown: Record<string, number>
}

export interface ScoringWeights {
  margin: number // default 30
  blankQuality: number // default 20
  colorAvailability: number // default 15
  sizeRange: number // default 10
  printArea: number // default 10
  providerLocation: number // default 5
  shippingCost: number // default 5
  printMethod: number // default 5
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  margin: 30,
  blankQuality: 20,
  colorAvailability: 15,
  sizeRange: 10,
  printArea: 10,
  providerLocation: 5,
  shippingCost: 5,
  printMethod: 5,
}

/**
 * Categorize a blueprint based on its title/tags.
 */
export function categorizeBlueprint(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('hoodie') || t.includes('hooded sweatshirt')) return 'hoodies'
  if (t.includes('sweatshirt') || t.includes('crewneck') || t.includes('crew neck')) return 'sweatshirts'
  if (t.includes('t-shirt') || t.includes('tee') || t.includes('tshirt')) return 'tees'
  if (t.includes('hat') || t.includes('cap') || t.includes('beanie') || t.includes('snapback') || t.includes('trucker')) return 'hats'
  if (t.includes('tote') || t.includes('bag') || t.includes('pouch')) return 'totes'
  if (t.includes('jacket') || t.includes('windbreaker') || t.includes('bomber') || t.includes('vest')) return 'jackets'
  if (t.includes('pants') || t.includes('jogger') || t.includes('shorts') || t.includes('sweatpant')) return 'pants'
  return 'other'
}

/**
 * Check which brand colors are available in a variant's color options.
 */
function matchBrandColors(colorTitles: string[]): string[] {
  const matched: string[] = []
  const lowerColors = colorTitles.map((c) => c.toLowerCase())

  for (const [brandColor, aliases] of Object.entries(BRAND_COLORS)) {
    if (aliases.some((alias) => lowerColors.some((c) => c.includes(alias)))) {
      matched.push(brandColor)
    }
  }
  return matched
}

/**
 * Score a single blueprint × provider combination.
 */
export function scoreSku(
  blueprint: any,
  provider: any,
  variants: any[],
  shipping: any,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoredSku {
  const category = categorizeBlueprint(blueprint.title)
  const targetRetail = TARGET_RETAIL[category] || TARGET_RETAIL.default

  // Parse variants into structured array
  const parsedVariants: ParsedVariant[] = variants.map((v: any) => {
    const title = v.title || ''
    const parts = title.split(/\s*\/\s*/)
    let color = ''
    let size = ''
    if (parts.length >= 2) {
      color = parts[0].trim()
      size = parts[parts.length - 1].trim()
    } else if (parts.length === 1) {
      const val = parts[0].trim()
      if (/^(XS|S|M|L|XL|2XL|3XL|4XL|5XL|\d+)$/i.test(val)) {
        size = val
      } else {
        color = val
      }
    }
    return {
      variantId: v.id,
      title,
      color,
      size,
      cost: v.cost || 0,
      costDollars: (v.cost || 0) / 100,
      isEnabled: v.is_enabled !== false,
      isAvailable: v.is_available !== false,
      options: v.options || {},
    }
  })

  const enabledParsed = parsedVariants.filter((v) => v.isEnabled)
  const costs = enabledParsed.map((v) => v.costDollars).filter((c) => c > 0)
  const minCost = costs.length > 0 ? Math.min(...costs) : 0
  const maxCost = costs.length > 0 ? Math.max(...costs) : 0

  // Extract unique colors and sizes from parsed variants
  const colors = [...new Set(enabledParsed.map((v) => v.color).filter(Boolean))]
  const sizes = [...new Set(enabledParsed.map((v) => v.size).filter(Boolean))]
  const brandColors = matchBrandColors(colors)

  // Print areas from first raw variant's placeholders
  const enabledRawVariants = variants.filter((v: any) => v.is_enabled !== false)
  let printAreaFront: { width: number; height: number } | null = null
  let printAreaBack: { width: number; height: number } | null = null
  let printAreaCount = 0

  if (enabledRawVariants[0]?.placeholders) {
    for (const ph of enabledRawVariants[0].placeholders) {
      if (ph.position === 'front' && ph.width && ph.height) {
        printAreaFront = { width: ph.width, height: ph.height }
        printAreaCount++
      }
      if (ph.position === 'back' && ph.width && ph.height) {
        printAreaBack = { width: ph.width, height: ph.height }
        printAreaCount++
      }
      if (ph.position !== 'front' && ph.position !== 'back') {
        printAreaCount++
      }
    }
  }

  // Shipping
  let shippingCostUs = 0
  let handlingTime = ''
  if (shipping) {
    handlingTime = shipping.handling_time
      ? `${shipping.handling_time.value} ${shipping.handling_time.unit}`
      : ''
    const usProfile = shipping.profiles?.find((p: any) =>
      p.countries?.includes('US'),
    )
    if (usProfile) {
      shippingCostUs = (usProfile.first_item?.cost || 0) / 100
    }
  }

  // Margin calculation
  const totalCost = minCost + shippingCostUs + stripeFee(targetRetail)
  const profitPerUnit = targetRetail - totalCost
  const marginPercent = targetRetail > 0 ? (profitPerUnit / targetRetail) * 100 : 0

  // Decoration methods — store full objects { id, title }
  const rawDecoMethods = provider.decoration_methods || []
  const decorationMethods: { id: number; title: string }[] = rawDecoMethods.map(
    (d: any) => ({
      id: typeof d === 'number' ? d : (d.id || 0),
      title: typeof d === 'string' ? d : (d.title || d.name || `method-${d.id || 'unknown'}`),
    }),
  )
  const decoTitles = decorationMethods.map((m) => m.title.toLowerCase())
  const hasDtg = decoTitles.some((t) => t.includes('dtg') || t.includes('direct to garment'))
  const hasDtf = decoTitles.some((t) => t.includes('dtf') || t.includes('direct to film'))

  // Provider location (heuristic — US-based if title contains US indicators)
  const providerTitle = provider.title || ''
  const isUsProvider =
    /\bUS\b|\bUSA\b|united states|america/i.test(providerTitle) ||
    // Most large Printify providers are US-based by default
    true // Assume US unless proven otherwise

  // Size checks
  const sizeSet = new Set(sizes.map((s) => s.toUpperCase()))
  const hasSizeS = sizeSet.has('S')
  const hasSizeM = sizeSet.has('M')
  const hasSizeL = sizeSet.has('L')
  const hasSizeXL = sizeSet.has('XL')
  const hasSize2XL = sizeSet.has('2XL') || sizeSet.has('XXL')
  const sizeRange =
    sizes.length > 0 ? `${sizes[0]} - ${sizes[sizes.length - 1]}` : 'N/A'

  // ── Scoring ──
  const scoreBreakdown: Record<string, number> = {}

  // 1. Margin (0-100, weight applied later)
  if (marginPercent >= 55) scoreBreakdown.margin = 100
  else if (marginPercent >= 50) scoreBreakdown.margin = 90
  else if (marginPercent >= 45) scoreBreakdown.margin = 75
  else if (marginPercent >= 40) scoreBreakdown.margin = 50
  else if (marginPercent >= 35) scoreBreakdown.margin = 25
  else scoreBreakdown.margin = 0

  // 2. Blank quality (brand recognition)
  const brandLower = (blueprint.brand || '').toLowerCase()
  if (PREMIUM_BRANDS.some((b) => brandLower.includes(b))) {
    scoreBreakdown.blankQuality = 100
  } else if (GOOD_BRANDS.some((b) => brandLower.includes(b))) {
    scoreBreakdown.blankQuality = 60
  } else {
    scoreBreakdown.blankQuality = 30
  }

  // 3. Color availability (brand palette coverage)
  scoreBreakdown.colorAvailability = Math.min(
    100,
    (brandColors.length / 4) * 100,
  ) // 4 brand colors = 100%

  // 4. Size range
  const essentialSizes = [hasSizeS, hasSizeM, hasSizeL, hasSizeXL].filter(
    Boolean,
  ).length
  scoreBreakdown.sizeRange = (essentialSizes / 4) * 80 + (hasSize2XL ? 20 : 0)

  // 5. Print area
  if (printAreaFront) {
    const area = printAreaFront.width * printAreaFront.height
    if (area >= 20_000_000) scoreBreakdown.printArea = 100 // 4500x5400+
    else if (area >= 15_000_000) scoreBreakdown.printArea = 80
    else if (area >= 10_000_000) scoreBreakdown.printArea = 60
    else scoreBreakdown.printArea = 40
    if (printAreaBack) scoreBreakdown.printArea = Math.min(100, scoreBreakdown.printArea + 15)
  } else {
    scoreBreakdown.printArea = 20
  }

  // 6. Provider location
  scoreBreakdown.providerLocation = isUsProvider ? 100 : 30

  // 7. Shipping cost
  if (shippingCostUs <= 4) scoreBreakdown.shippingCost = 100
  else if (shippingCostUs <= 5.5) scoreBreakdown.shippingCost = 80
  else if (shippingCostUs <= 7) scoreBreakdown.shippingCost = 60
  else if (shippingCostUs <= 9) scoreBreakdown.shippingCost = 40
  else scoreBreakdown.shippingCost = 20

  // 8. Print method
  if (hasDtg || hasDtf) scoreBreakdown.printMethod = 100
  else scoreBreakdown.printMethod = 50

  // Calculate weighted total
  const totalWeight =
    weights.margin +
    weights.blankQuality +
    weights.colorAvailability +
    weights.sizeRange +
    weights.printArea +
    weights.providerLocation +
    weights.shippingCost +
    weights.printMethod

  const score = Math.round(
    (scoreBreakdown.margin * weights.margin +
      scoreBreakdown.blankQuality * weights.blankQuality +
      scoreBreakdown.colorAvailability * weights.colorAvailability +
      scoreBreakdown.sizeRange * weights.sizeRange +
      scoreBreakdown.printArea * weights.printArea +
      scoreBreakdown.providerLocation * weights.providerLocation +
      scoreBreakdown.shippingCost * weights.shippingCost +
      scoreBreakdown.printMethod * weights.printMethod) /
      totalWeight,
  )

  return {
    blueprintId: blueprint.id,
    blueprintTitle: blueprint.title,
    blueprintBrand: blueprint.brand || '',
    blueprintModel: blueprint.model || '',
    blueprintImages: blueprint.images || [],
    providerId: provider.id,
    providerTitle,
    decorationMethods,
    category,
    minCost,
    maxCost,
    shippingCostUs,
    handlingTime,
    targetRetail,
    marginPercent: Math.round(marginPercent * 10) / 10,
    profitPerUnit: Math.round(profitPerUnit * 100) / 100,
    totalVariants: parsedVariants.length,
    enabledVariants: enabledParsed.length,
    availableColors: colors,
    brandColorsAvailable: brandColors,
    brandColorCount: brandColors.length,
    availableSizes: sizes,
    sizeRange,
    hasSizeS,
    hasSizeM,
    hasSizeL,
    hasSizeXL,
    hasSize2XL,
    printAreaFront,
    printAreaBack,
    printAreaCount,
    isUsProvider,
    variants: parsedVariants,
    score,
    scoreBreakdown,
  }
}
