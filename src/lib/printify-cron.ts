/**
 * Printify Catalog Sync — Cron Scheduler.
 *
 * Sets up periodic incremental sync every 6 hours.
 * Only runs if ENABLE_PRINTIFY_SYNC=true in env vars.
 *
 * Called from payload.config.ts onInit hook.
 */

import type { Payload } from 'payload'
import { runSync, getSyncProgress } from '@/lib/printify-sync'

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 hours
let cronTimer: ReturnType<typeof setInterval> | null = null

export function startPrintifyCron(payload: Payload): void {
  // Only run if explicitly enabled
  if (process.env.ENABLE_PRINTIFY_SYNC !== 'true') {
    payload.logger.info('[Printify Cron] Disabled — set ENABLE_PRINTIFY_SYNC=true to enable')
    return
  }

  // Don't start if Printify is not configured
  if (!process.env.PRINTIFY_API_TOKEN || !process.env.PRINTIFY_SHOP_ID) {
    payload.logger.info('[Printify Cron] Skipped — PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID not set')
    return
  }

  // Clear any existing timer (safety — in case of hot reload)
  if (cronTimer) {
    clearInterval(cronTimer)
  }

  payload.logger.info(`[Printify Cron] Started — incremental sync every ${SYNC_INTERVAL_MS / 3600000}h`)

  // Run initial sync on boot if cache is empty
  scheduleInitialSync(payload)

  // Set up recurring sync
  cronTimer = setInterval(() => {
    runPeriodicSync(payload)
  }, SYNC_INTERVAL_MS)
}

async function scheduleInitialSync(payload: Payload): Promise<void> {
  // Wait 10 seconds for server to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 10_000))

  try {
    const cacheCount = await payload.count({
      collection: 'printify-catalog-cache' as any,
    })

    if (cacheCount.totalDocs === 0) {
      payload.logger.info('[Printify Cron] Cache empty — running initial full sync...')
      runSync(payload, 'full', 'first-boot', '').catch((err) => {
        payload.logger.error(`[Printify Cron] Initial sync failed: ${err.message}`)
      })
    } else {
      // Check if data is stale (>24h old)
      const lastSync = await payload.find({
        collection: 'printify-sync-log' as any,
        limit: 1,
        sort: '-completedAt',
        where: { status: { in: ['completed', 'partial'] } },
        depth: 0,
        select: { completedAt: true },
      })

      const lastSyncAt = (lastSync.docs[0] as any)?.completedAt
      if (lastSyncAt) {
        const age = Date.now() - new Date(lastSyncAt).getTime()
        if (age > 24 * 60 * 60 * 1000) {
          payload.logger.info('[Printify Cron] Cache stale (>24h) — running incremental sync...')
          runSync(payload, 'incremental', 'cron', '').catch((err) => {
            payload.logger.error(`[Printify Cron] Stale sync failed: ${err.message}`)
          })
        } else {
          payload.logger.info(`[Printify Cron] Cache fresh (${Math.round(age / 3600000)}h old) — skipping boot sync`)
        }
      }
    }
  } catch (err: any) {
    payload.logger.error(`[Printify Cron] Boot check failed: ${err.message}`)
  }
}

async function runPeriodicSync(payload: Payload): Promise<void> {
  // Don't start if a sync is already running
  const progress = getSyncProgress()
  if (progress?.isRunning) {
    payload.logger.info('[Printify Cron] Skipping — sync already in progress')
    return
  }

  payload.logger.info('[Printify Cron] Running scheduled incremental sync...')

  try {
    const result = await runSync(payload, 'incremental', 'cron', '')
    payload.logger.info(`[Printify Cron] Sync completed: ${result.summary}`)
  } catch (err: any) {
    payload.logger.error(`[Printify Cron] Sync failed: ${err.message}`)
  }
}

export function stopPrintifyCron(): void {
  if (cronTimer) {
    clearInterval(cronTimer)
    cronTimer = null
  }
}
