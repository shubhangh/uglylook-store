/**
 * Safe fetch for server-side image downloads.
 * Validates URL against an allowlist and enforces size/timeout limits.
 */

const ALLOWED_HOSTS = new Set([
  'media.uglylook.com',
  'images-api.printify.com',
  'images.printify.com',
  'localhost',
])

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024 // 10MB
const FETCH_TIMEOUT_MS = 10_000 // 10s

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    if (ALLOWED_HOSTS.has(url.hostname)) return true
    // Allow same-origin (NEXT_PUBLIC_SERVER_URL)
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
    if (serverUrl) {
      const server = new URL(serverUrl)
      if (url.hostname === server.hostname) return true
    }
    return false
  } catch {
    return false
  }
}

export async function safeFetchImage(
  url: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!isAllowedUrl(url)) {
    console.warn(`[safe-fetch] Blocked fetch to non-allowed host: ${url}`)
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null

    const contentLength = parseInt(res.headers.get('content-length') || '0', 10)
    if (contentLength > MAX_RESPONSE_SIZE) {
      console.warn(`[safe-fetch] Response too large (${contentLength} bytes): ${url}`)
      return null
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length > MAX_RESPONSE_SIZE) {
      console.warn(`[safe-fetch] Downloaded content too large (${buffer.length} bytes): ${url}`)
      return null
    }

    return {
      buffer,
      mimeType: res.headers.get('content-type') || 'image/png',
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
