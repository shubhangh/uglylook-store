/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window per key (IP or identifier).
 *
 * Not distributed — resets on server restart. Suitable for
 * single-instance deployments. For multi-instance, use Redis.
 */

const store = new Map<string, number[]>()

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of store) {
    const filtered = timestamps.filter((t) => now - t < 60_000)
    if (filtered.length === 0) store.delete(key)
    else store.set(key, filtered)
  }
}, 300_000)

interface RateLimitResult {
  allowed: boolean
  remaining: number
}

/**
 * Check if a request is within the rate limit.
 * @param key - Unique identifier (e.g., IP address)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60s)
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000,
): RateLimitResult {
  const now = Date.now()
  const timestamps = store.get(key) || []
  const windowStart = now - windowMs
  const recent = timestamps.filter((t) => t > windowStart)

  if (recent.length >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  recent.push(now)
  store.set(key, recent)
  return { allowed: true, remaining: maxRequests - recent.length }
}

/**
 * Extract client IP from request headers.
 * Checks x-forwarded-for (CDN/proxy) then x-real-ip, falls back to 'unknown'.
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}
