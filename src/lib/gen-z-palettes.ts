/**
 * Gen Z color palettes, graphic styles, and quote bank for design generation.
 *
 * Source: design/ul-products-designs-related-docs/uglylook-design-system.html
 */

// ── Types ──

export type PaletteColor = {
  hex: string
  name: string
  role: string
}

export type GenZPalette = {
  id: string
  name: string
  colors: PaletteColor[]
  vibe: string
  genZWhy: string
  garmentPreview: { light: string; dark: string }
}

export type GraphicStyle = {
  label: string
  desc: string
  elements: string
}

export type QuoteBankEntry = {
  hero: string
  sub: string
  lane: string
}

// ── Palettes ──

export const GEN_Z_PALETTES: GenZPalette[] = [
  {
    id: 'muted-chaos',
    name: 'Muted Chaos',
    vibe: 'The "I thrifted this" energy. Earth tones that feel worn-in, not designed.',
    colors: [
      { hex: '#5C4033', name: 'Mud Brown', role: 'Primary — anchors on white, subtle on black' },
      { hex: '#C45B28', name: 'Burnt Rust', role: 'Secondary — warm pop, reads vintage' },
      { hex: '#E8DCC8', name: 'Bone', role: 'Light neutral — text on dark garments' },
      { hex: '#2B2B2B', name: 'Almost Black', role: 'Structure — text on light garments' },
    ],
    garmentPreview: { light: '#F5F0EB', dark: '#1A1A1A' },
    genZWhy: 'Muted earth tones are dominating Gen Z fashion — think Yeezy, early Stussy, Japanese workwear. The anti-neon.',
  },
  {
    id: 'digital-rot',
    name: 'Digital Rot',
    vibe: "Screen-burnt eyes at 3am. Sickly greens and washed purples — beautiful and wrong.",
    colors: [
      { hex: '#A8E6CF', name: 'Sick Mint', role: 'Primary — eerie glow on dark, fresh on light' },
      { hex: '#845EC2', name: 'Twilight Purple', role: 'Secondary — the "terminally online" color' },
      { hex: '#F0E6D3', name: 'Parchment', role: 'Light neutral — warmth against the digital cold' },
      { hex: '#1E1E2E', name: 'Void Navy', role: 'Structure — softer than pure black' },
    ],
    garmentPreview: { light: '#F7F4EF', dark: '#111118' },
    genZWhy: 'Mint green + muted purple is the color language of indie games, Lo-fi streams, and Tumblr revival.',
  },
  {
    id: 'concrete-heat',
    name: 'Concrete Heat',
    vibe: 'Brutalist architecture meets hot sauce. Hard surfaces, one burst of warmth.',
    colors: [
      { hex: '#FF6B35', name: 'Traffic Orange', role: 'Primary — impossible to ignore on any background' },
      { hex: '#B0B0B0', name: 'Raw Concrete', role: 'Secondary — industrial, neutral, grounding' },
      { hex: '#F2E9E1', name: 'Plaster White', role: 'Light neutral — chalky, not clinical' },
      { hex: '#252525', name: 'Charcoal', role: 'Structure — warm black, not cold' },
    ],
    garmentPreview: { light: '#EDEDED', dark: '#1C1C1C' },
    genZWhy: 'Orange is having a massive resurgence — Heron Preston, Palace, construction-core. Paired with grey it reads utilitarian-cool.',
  },
  {
    id: 'faded-flash',
    name: 'Faded Flash',
    vibe: 'Disposable camera at a house party. Colors that feel like a memory of a color.',
    colors: [
      { hex: '#FF8FAB', name: 'Washed Pink', role: 'Primary — soft enough for boys, loud enough for shirts' },
      { hex: '#4A6FA5', name: 'Denim Blue', role: 'Secondary — grounding, familiar, slightly melancholy' },
      { hex: '#FFF5E1', name: 'Warm Cream', role: 'Light neutral — golden hour light' },
      { hex: '#2C2C34', name: 'Film Black', role: 'Structure — the dark of an unlit room' },
    ],
    garmentPreview: { light: '#FAF6F0', dark: '#1E1E24' },
    genZWhy: 'Desaturated pink + dusty blue is the palette of Frank Ocean album art, Glossier, and sad-boy aesthetics.',
  },
]

// ── Graphic Styles ──

export const GRAPHIC_STYLES: Record<string, GraphicStyle> = {
  'wireframe-cluster': {
    label: 'Wireframe Cluster',
    desc: 'Flat vector, hard edges, outline-only geometric shapes overlapping like a dumped UI component library. Varying stroke weights (1px to 4px). No fills — outlines only. Halftone dot patterns used sparingly as texture inside one shape.',
    elements: '4-6 overlapping geometric shapes (rectangles with slightly rounded corners, circles, one triangle, one hexagon). All rendered as outlines only, no fills. One shape has a halftone dot fill. A single 1.5px connector line with a 90-degree bend links two shapes. A small dot grid (4x6, 3px dots, 12px spacing) sits behind the cluster. Two floating accent marks — an asterisk and a forward slash — placed in negative space.',
  },
  'corrupted-scan': {
    label: 'Corrupted Scan',
    desc: 'Photocopied-too-many-times aesthetic. Scan-line artifacts, registration marks, halftone grain. Elements look like they were printed, scanned, printed again, and scanned once more.',
    elements: 'Layered geometric shapes with deliberately misaligned duplicate outlines (3px offset), simulating bad print registration. Horizontal scan lines (1px, varying opacity) running across the composition. One large circle with concentric rings inside it. A registration/crop mark (crosshair-in-circle, small) in one corner. Scattered halftone dots degrading from dense to sparse across one area. A thin ruled line with tick marks, like a measurement scale, running along one edge.',
  },
  'brutalist-grid': {
    label: 'Brutalist Grid',
    desc: 'Hard grid structure with elements that break the grid intentionally. Thick lines, heavy blocks, one element rotated 12-15 degrees to break the pattern. Industrial, architectural.',
    elements: 'A visible grid structure (6x4, thin lines) with most cells empty. 2-3 cells filled with solid color blocks. One oversized circle breaking the grid boundary. One element (a triangle or rectangle) rotated 12 degrees, overlapping the grid. Thick border lines (4-6px) framing partial edges of the composition — not a complete border, just 2-3 sides. A small cluster of parallel diagonal lines (hatching pattern) in one area.',
  },
}

// ── Quote Bank ──

export const QUOTE_BANK: QuoteBankEntry[] = [
  { hero: 'DO NOT PERCEIVE ME', sub: 'visibility: hidden', lane: 'Ironic text' },
  { hero: 'MY THERAPIST WOULD HATE THIS', sub: 'session #47 pending', lane: 'Ironic text' },
  { hero: 'I PEAKED IN MY SCREEN TIME', sub: 'avg. 11h 42m daily', lane: 'Ironic text' },
  { hero: 'CHRONICALLY ONLINE, PHYSICALLY HERE', sub: 'last seen: just now', lane: 'Anti-design' },
  { hero: 'THIS IS MY PERSONALITY NOW', sub: 'update 4.7 / no rollback', lane: 'Weirdcore' },
  { hero: 'NOT WORTH THE EMOTIONAL LABOR', sub: 'cost-benefit: negative', lane: 'Brutalist' },
  { hero: "I'M SOMEBODY'S UNSAVED NUMBER", sub: '+1 (000) 000-0000', lane: 'Ironic text' },
  { hero: 'LOWKEY UNHINGED HIGHKEY FINE', sub: 'status: stable-ish', lane: 'Maximalist' },
  { hero: 'EMOTIONALLY UNAVAILABLE BUT HERE', sub: 'read 3:42am', lane: 'Anti-design' },
  { hero: 'MAIN CHARACTER IN A MID SHOW', sub: 'season 24 / no renewal', lane: 'Ironic text' },
  { hero: 'RUNNING ON SPITE AND WIFI', sub: 'battery: 3%', lane: 'Brutalist' },
  { hero: 'PERMANENT SOFT LAUNCH', sub: 'ETA: never', lane: 'Ironic text' },
  { hero: 'DELULU IS THE SOLULU', sub: 'prescription: refilled', lane: 'Weirdcore' },
  { hero: 'SITUATIONSHIP SURVIVOR', sub: 'damage: permanent', lane: 'Ironic text' },
  { hero: 'GAVE UP ON ADULTING', sub: 'task failed successfully', lane: 'Anti-design' },
  { hero: 'MY RED FLAG IS IGNORING RED FLAGS', sub: 'warnings: 47 dismissed', lane: 'Brutalist' },
]

// ── Graphics-Only Prompt Template ──

export const GRAPHICS_ONLY_PROMPT_TEMPLATE = `**GRAPHICS-ONLY PROMPT — UglyLook Design Element**

**CRITICAL TEXT RULE:**
Absolutely NO text, NO letters, NO numbers, NO words, NO characters, NO typography of ANY kind anywhere in the image. Not even partially visible, not even blurred, not even as texture. ZERO text elements. This is a graphics-only design element — all typography will be added manually in post-production.

**Subject & Composition:**
A collection of abstract graphic elements on a fully transparent background (PNG, no background fill). The composition is {{ORIENTATION}}-oriented, roughly {{SIZE}}px at 300dpi. Elements are arranged {{LAYOUT}}. The overall feel is a deconstructed design toolkit — shapes, lines, and patterns that exist as a system, not a finished poster.

**Color Palette:**
Strict {{COUNT}}-color palette:
{{COLORS}}
NO pure white (#FFFFFF) and NO pure black (#000000).

**Visual Style:**
{{STYLE_DESC}}

**Graphic Elements:**
{{ELEMENTS_DESC}}

**EXCLUDE (hard constraints):**
- NO TEXT of any kind — no letters, no numbers, no symbols, no characters, no words, no typography, no font specimens, no text fragments, no watermarks, no signatures
- No background — fully transparent PNG
- No photographic elements, no AI faces, no human figures, no animals
- No 3D rendering, no metallic textures, no chrome, no glass
- No fabric texture simulation
- No copyrighted symbols or brand logos
- No soft aesthetics: no hearts, no flowers, no butterflies, no rainbows

**Technical Specs:**
- Format: PNG with full alpha transparency
- Resolution: {{SIZE}}px at 300dpi
- Color mode: sRGB
- Clean anti-aliased edges for DTG/sublimation printing
- 250px transparent margin on all sides`

// ── Helpers ──

export function getPaletteById(id: string): GenZPalette | undefined {
  return GEN_Z_PALETTES.find((p) => p.id === id)
}

export function buildGraphicsOnlyPrompt(
  paletteId: string,
  styleId: string,
  orientation: 'vertical' | 'horizontal' | 'square',
): string {
  const palette = getPaletteById(paletteId)
  const style = GRAPHIC_STYLES[styleId]
  if (!palette || !style) throw new Error(`Invalid palette "${paletteId}" or style "${styleId}"`)

  const sizeMap = { vertical: '3500x4200', horizontal: '4200x3200', square: '3600x3600' }
  const orientMap = { vertical: 'vertically', horizontal: 'horizontally', square: 'square' }
  const layoutMap = {
    vertical: 'with primary elements in the upper-right quadrant and secondary elements anchoring the lower-left, creating diagonal tension',
    horizontal: 'across a wide horizontal band with elements clustered left-of-center and negative space breathing on the right',
    square: 'in an off-center composition pushing toward the lower-left, with counter-elements in the upper-right for asymmetric balance',
  }

  const colorsStr = palette.colors.map((c) => `- ${c.name} (${c.hex}) — ${c.role}`).join('\n')

  return GRAPHICS_ONLY_PROMPT_TEMPLATE
    .replace('{{ORIENTATION}}', orientMap[orientation])
    .replaceAll('{{SIZE}}', sizeMap[orientation])
    .replace('{{LAYOUT}}', layoutMap[orientation])
    .replace('{{COUNT}}', palette.colors.length.toString())
    .replace('{{COLORS}}', colorsStr)
    .replace('{{STYLE_DESC}}', style.desc)
    .replace('{{ELEMENTS_DESC}}', style.elements)
}

/**
 * Build palette context string for prompt engine injection.
 */
export function buildPaletteContext(paletteId: string): string {
  const palette = getPaletteById(paletteId)
  if (!palette) return ''

  return `PALETTE: ${palette.name}
${palette.colors.map((c) => `  - ${c.name} ${c.hex} — ${c.role}`).join('\n')}`
}

/**
 * Build style context string for prompt engine injection.
 */
export function buildStyleContext(styleId: string): string {
  const style = GRAPHIC_STYLES[styleId]
  if (!style) return ''

  return `STYLE: ${style.label}
  ${style.desc}`
}
