/**
 * Parse uploaded files from a folder upload (webkitdirectory).
 * Groups images by product number and extracts category from folder name.
 */

export type ImageVariant = 'logo' | 'graphic' | 'text' | 'raw'

export type ParsedImage = {
  fileName: string
  variant: ImageVariant
  buffer: Buffer
  mimeType: string
}

export type ParsedProduct = {
  number: string // e.g. "01", "18"
  name: string // e.g. "icon-snapback-black", "neon-psychedelic-tee"
  category: string // folder name → mapped category title
  images: ParsedImage[]
  primaryImage: ParsedImage // logo > graphic > text > raw
}

// Folder name → Payload category title
const CATEGORY_MAP: Record<string, string> = {
  hats: 'Hats',
  hoodies: 'Hoodies',
  tshirts: 'T-Shirts',
  totes: 'Totes',
  jackets: 'Jackets',
  pants: 'Pants',
  accessories: 'Accessories',
  sets: 'Sets',
}

// Folders to skip (duplicates that exist in their primary category folder)
const SKIP_FOLDERS = new Set(['neon'])

// Image variant priority for selecting the primary/hero image
const VARIANT_PRIORITY: ImageVariant[] = ['logo', 'graphic', 'text', 'raw']

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : ''
}

function getMimeType(ext: string): string {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

function parseVariant(fileName: string): ImageVariant {
  const lower = fileName.toLowerCase()
  if (lower.includes('-logo')) return 'logo'
  if (lower.includes('-graphic')) return 'graphic'
  if (lower.includes('-text')) return 'text'
  if (lower.includes('-raw')) return 'raw'
  return 'logo' // default fallback
}

function parseProductName(fileName: string): { number: string; name: string } {
  // Remove extension
  const base = fileName.replace(/\.[^.]+$/, '')
  // Match: {number}-{name}-{variant}
  const match = base.match(/^(\d+)-(.+?)-(logo|graphic|text|raw)$/i)
  if (match) {
    return { number: match[1].padStart(2, '0'), name: match[2] }
  }
  // Fallback: just split on first dash
  const dashIdx = base.indexOf('-')
  if (dashIdx > 0) {
    return {
      number: base.slice(0, dashIdx).padStart(2, '0'),
      name: base.slice(dashIdx + 1),
    }
  }
  return { number: '00', name: base }
}

export type UploadedFile = {
  name: string // original filename
  relativePath: string // e.g. "hats/01-icon-snapback-black-logo.jpg"
  buffer: Buffer
}

export function parseUploadedFiles(files: UploadedFile[]): ParsedProduct[] {
  // Group by product number, skip neon/ duplicates
  const groups = new Map<
    string,
    { name: string; category: string; images: ParsedImage[] }
  >()

  for (const file of files) {
    const ext = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.has(ext)) continue

    // Extract folder from relative path
    const pathParts = file.relativePath.replace(/\\/g, '/').split('/')
    // Path could be "5/hats/01-file.jpg" or "hats/01-file.jpg"
    let folder = ''
    for (const part of pathParts) {
      const lower = part.toLowerCase()
      if (CATEGORY_MAP[lower] || SKIP_FOLDERS.has(lower)) {
        folder = lower
        break
      }
    }

    if (!folder || SKIP_FOLDERS.has(folder)) continue
    const category = CATEGORY_MAP[folder]
    if (!category) continue

    const { number, name } = parseProductName(file.name)
    const variant = parseVariant(file.name)
    const key = number // group by product number

    if (!groups.has(key)) {
      groups.set(key, { name, category, images: [] })
    }

    const group = groups.get(key)!
    // Keep the longest name (most descriptive) for the product
    if (name.length > group.name.length) {
      group.name = name
    }

    group.images.push({
      fileName: file.name,
      variant,
      buffer: file.buffer,
      mimeType: getMimeType(ext),
    })
  }

  // Build parsed products with primary image selection
  const products: ParsedProduct[] = []

  for (const [number, group] of groups) {
    if (group.images.length === 0) continue

    // Sort images: logo first, then graphic, text, raw
    group.images.sort((a, b) => {
      return VARIANT_PRIORITY.indexOf(a.variant) - VARIANT_PRIORITY.indexOf(b.variant)
    })

    const primaryImage =
      group.images.find((img) => img.variant === 'logo') ||
      group.images.find((img) => img.variant === 'graphic') ||
      group.images.find((img) => img.variant === 'text') ||
      group.images[0]

    products.push({
      number,
      name: group.name,
      category: group.category,
      images: group.images,
      primaryImage,
    })
  }

  // Sort by product number
  products.sort((a, b) => a.number.localeCompare(b.number))

  return products
}
