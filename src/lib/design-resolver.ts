/**
 * Design Resolver — Resolves design keys to file URLs and auto-generates text compositions.
 *
 * Priority chain:
 * 1. Explicit design URL → use as-is
 * 2. Design key (e.g., "logo-horiz-light") → look up in registry
 * 3. Text provided → auto-generate text + logo composition (future: Canvas API)
 * 4. Auto-select by category + garment color
 */

// ── Design Registry ──
// Maps design keys to known file paths (relative to project root / R2 URLs)

const LOGO_DESIGNS: Record<string, string> = {
  'logo-horiz-light': 'logos-ready/light-horiz.png',
  'logo-horiz-dark': 'logos-ready/dark-horiz.png',
  'logo-icon-light': 'logos-ready/light-icon.png',
  'logo-icon-dark': 'logos-ready/dark-icon.png',
  'logo-word-light': 'logos-ready/light-word.png',
  'logo-word-dark': 'logos-ready/dark-word.png',
}

// Category + color → default design key mapping
const AUTO_SELECT_MAP: Record<string, Record<string, string>> = {
  hoodies: {
    dark: 'logo-horiz-light',
    light: 'logo-horiz-dark',
    default: 'logo-horiz-light',
  },
  tees: {
    dark: 'logo-horiz-light',
    light: 'logo-horiz-dark',
    default: 'logo-horiz-light',
  },
  hats: {
    dark: 'logo-icon-light',
    light: 'logo-icon-dark',
    default: 'logo-icon-light',
  },
  totes: {
    dark: 'logo-horiz-light',
    light: 'logo-horiz-dark',
    default: 'logo-horiz-dark', // totes are usually natural/light
  },
  sweatshirts: {
    dark: 'logo-horiz-light',
    light: 'logo-horiz-dark',
    default: 'logo-horiz-light',
  },
}

// Colors classified as dark or light
const DARK_COLORS = ['black', 'navy', 'dark', 'charcoal', 'forest', 'maroon', 'olive']
const LIGHT_COLORS = ['white', 'bone', 'cream', 'sand', 'natural', 'ivory', 'oatmeal', 'light']

export type ResolvedDesign = {
  url: string | null
  key: string | null
  source: 'explicit' | 'key' | 'auto-select' | 'none'
  localPath: string | null
}

/**
 * Resolve a design for a product.
 *
 * @param designUrl — explicit URL (highest priority)
 * @param designKey — key like "logo-horiz-light"
 * @param category — "hoodies", "tees", "hats", "totes"
 * @param garmentColor — primary garment color name (e.g., "Black", "Bone")
 * @param r2PublicUrl — R2 public URL prefix for constructing full URLs
 */
export function resolveDesign(
  designUrl?: string,
  designKey?: string,
  category?: string,
  garmentColor?: string,
  r2PublicUrl?: string,
): ResolvedDesign {
  // 1. Explicit URL
  if (designUrl) {
    return { url: designUrl, key: null, source: 'explicit', localPath: null }
  }

  // 2. Design key lookup
  if (designKey && LOGO_DESIGNS[designKey]) {
    const localPath = LOGO_DESIGNS[designKey]
    const url = r2PublicUrl ? `${r2PublicUrl}/${localPath}` : null
    return { url, key: designKey, source: 'key', localPath }
  }

  // 3. Auto-select by category + color
  if (category) {
    const categoryMap = AUTO_SELECT_MAP[category] || AUTO_SELECT_MAP.tees
    const colorTone = classifyColor(garmentColor || '')
    const autoKey = categoryMap[colorTone] || categoryMap.default
    const localPath = LOGO_DESIGNS[autoKey]
    const url = r2PublicUrl ? `${r2PublicUrl}/${localPath}` : null
    return { url, key: autoKey, source: 'auto-select', localPath }
  }

  return { url: null, key: null, source: 'none', localPath: null }
}

/**
 * Classify a color name as "dark" or "light".
 */
function classifyColor(color: string): 'dark' | 'light' | 'default' {
  const lower = color.toLowerCase()
  if (DARK_COLORS.some((c) => lower.includes(c))) return 'dark'
  if (LIGHT_COLORS.some((c) => lower.includes(c))) return 'light'
  return 'default'
}

/**
 * Get all available design keys.
 */
export function getAvailableDesignKeys(): { key: string; path: string }[] {
  return Object.entries(LOGO_DESIGNS).map(([key, path]) => ({ key, path }))
}

/**
 * Get the auto-select map for a category.
 */
export function getAutoSelectForCategory(
  category: string,
): Record<string, string> | null {
  return AUTO_SELECT_MAP[category] || null
}
