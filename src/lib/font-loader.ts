/**
 * Dynamic Google Fonts loader — fetches font binaries at runtime, caches in memory.
 *
 * Supports any Google Font (900+ families). No bundled TTF files needed.
 * Cold start: ~100-200ms network fetch (one-time per font per container lifetime).
 * Warm: 0ms (Map lookup).
 */

const fontCache = new Map<string, ArrayBuffer>()

/**
 * Fetch a Google Font as an ArrayBuffer (for Satori).
 * Uses a non-browser User-Agent to get TTF format (Satori also supports woff2).
 */
export async function fetchGoogleFont(
  family: string,
  weight: number,
): Promise<ArrayBuffer> {
  const key = `${family}:${weight}`
  const cached = fontCache.get(key)
  if (cached) return cached

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`
  const cssRes = await fetch(cssUrl, {
    headers: {
      // Modern browser UA → returns woff2 (Satori supports it)
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    },
  })

  if (!cssRes.ok) {
    throw new Error(
      `Google Fonts CSS fetch failed for ${family}:${weight} — ${cssRes.status}`,
    )
  }

  const css = await cssRes.text()

  // Parse font URL from CSS: src: url(...) format('woff2')
  const urlMatch = css.match(/src:\s*url\(([^)]+)\)/)
  if (!urlMatch) {
    throw new Error(
      `No font URL found in Google Fonts CSS for ${family}:${weight}`,
    )
  }

  const fontRes = await fetch(urlMatch[1])
  if (!fontRes.ok) {
    throw new Error(
      `Font binary fetch failed for ${family}:${weight} — ${fontRes.status}`,
    )
  }

  const buffer = await fontRes.arrayBuffer()
  fontCache.set(key, buffer)
  return buffer
}
