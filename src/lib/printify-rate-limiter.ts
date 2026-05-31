/**
 * Sliding window rate limiter for Printify Catalog API.
 *
 * Printify limit: 100 requests/min for catalog endpoints.
 * We use 85/min to leave 15% headroom.
 */

const WINDOW_MS = 60_000
const MAX_CALLS = 85

class RateLimiter {
  private calls: number[] = []

  async throttle(): Promise<void> {
    const now = Date.now()
    // Remove calls older than window
    this.calls = this.calls.filter((t) => now - t < WINDOW_MS)

    if (this.calls.length >= MAX_CALLS) {
      const oldest = this.calls[0]
      const waitMs = WINDOW_MS - (now - oldest) + 200
      await new Promise((resolve) => setTimeout(resolve, waitMs))
      // Clean again after waiting
      this.calls = this.calls.filter((t) => Date.now() - t < WINDOW_MS)
    }

    this.calls.push(Date.now())
  }

  get currentCount(): number {
    const now = Date.now()
    this.calls = this.calls.filter((t) => now - t < WINDOW_MS)
    return this.calls.length
  }
}

// Singleton — shared across all sync operations in this process
export const catalogRateLimiter = new RateLimiter()
