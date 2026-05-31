/** Static map of variant color labels to hex values.
 *  Used by VariantSelector to render color swatches.
 *  Long-term: add a `colorHex` field to VariantOption in the CMS. */
export const VARIANT_COLOR_MAP: Record<string, string> = {
  black: '#111111',
  'near-black': '#111111',
  white: '#F5F2EC',
  cream: '#F5F2EC',
  bone: '#D9D2C2',
  olive: '#5A6242',
  petrol: '#264A4F',
  navy: '#1A2744',
  grey: '#6B6B6B',
  gray: '#6B6B6B',
  charcoal: '#333333',
  red: '#8B2020',
  burgundy: '#5C1A1A',
}

export function getVariantColor(label: string): string | null {
  return VARIANT_COLOR_MAP[label.toLowerCase().trim()] ?? null
}
