/**
 * In-memory generation queue — tracks active and queued generations per user.
 *
 * Concurrent limit: 1 per user.
 * Other users see who's generating and their queue position.
 */

export type ActiveGeneration = {
  userId: string
  userEmail: string
  model: string
  count: number
  startedAt: number
  // Progress tracking
  completed: number
  failed: number
  currentIndex: number
  costSoFar: number
  costPerImage: number
  lastImageAt: number
}

export type QueueEntry = {
  userId: string
  userEmail: string
  model: string
  count: number
  queuedAt: number
}

let activeGeneration: ActiveGeneration | null = null
const queue: QueueEntry[] = []

export function getActiveGeneration(): ActiveGeneration | null {
  // Clear stale locks (>5 min)
  if (activeGeneration && Date.now() - activeGeneration.startedAt > 5 * 60 * 1000) {
    activeGeneration = null
  }
  return activeGeneration
}

export function setActiveGeneration(gen: ActiveGeneration | null): void {
  activeGeneration = gen
}

export function updateGenerationProgress(update: {
  completed: number
  failed?: number
  currentIndex: number
  costSoFar: number
}): void {
  if (activeGeneration) {
    activeGeneration.completed = update.completed
    if (update.failed !== undefined) activeGeneration.failed = update.failed
    activeGeneration.currentIndex = update.currentIndex
    activeGeneration.costSoFar = update.costSoFar
    activeGeneration.lastImageAt = Date.now()
  }
}

export function getQueue(): QueueEntry[] {
  return [...queue]
}

export function addToQueue(entry: QueueEntry): number {
  queue.push(entry)
  return queue.length // position
}

export function removeFromQueue(userId: string): void {
  const idx = queue.findIndex((e) => e.userId === userId)
  if (idx !== -1) queue.splice(idx, 1)
}

export function getNextInQueue(): QueueEntry | null {
  return queue.shift() || null
}

export function getUserQueuePosition(userId: string): number {
  const idx = queue.findIndex((e) => e.userId === userId)
  return idx === -1 ? -1 : idx + 1
}

export function getQueueStatus(userId: string): {
  isActive: boolean
  isQueued: boolean
  position: number
  progress: {
    completed: number
    total: number
    costSoFar: number
    costPerImage: number
    elapsedSeconds: number
    model: string
  } | null
  activeUser: { email: string; model: string; elapsedSeconds: number } | null
} {
  const active = getActiveGeneration()
  const isActive = active?.userId === userId
  const position = getUserQueuePosition(userId)

  return {
    isActive,
    isQueued: position > 0,
    position,
    progress: active && isActive
      ? {
          completed: active.completed || 0,
          failed: active.failed || 0,
          total: active.count,
          costSoFar: active.costSoFar || 0,
          costPerImage: active.costPerImage || 0,
          elapsedSeconds: Math.round((Date.now() - active.startedAt) / 1000),
          model: active.model,
        }
      : null,
    activeUser: active && !isActive
      ? {
          email: active.userEmail,
          model: active.model,
          elapsedSeconds: Math.round((Date.now() - active.startedAt) / 1000),
        }
      : null,
  }
}
