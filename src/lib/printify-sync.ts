/**
 * Printify Catalog Sync Worker.
 *
 * Background process that fetches from Printify API, scores SKUs,
 * and stores results in MongoDB (printify-catalog-cache collection).
 *
 * Supports: full sync, incremental sync.
 * Never blocks the admin UI — runs async.
 */

import { type Payload } from 'payload'
import { listBlueprints, getProviders, getVariants, getShipping } from '@/lib/printify'
import { scoreSku, categorizeBlueprint, type ScoredSku } from '@/lib/sku-scorer'
import { catalogRateLimiter } from '@/lib/printify-rate-limiter'

const TARGET_CATEGORIES = new Set(['hoodies', 'tees', 'hats', 'totes', 'sweatshirts'])
const MAX_PROVIDERS_PER_BLUEPRINT = 5
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours

// ── Progress tracking (in-memory, read by status API) ──

export type SyncProgress = {
  isRunning: boolean
  phase: string
  totalBlueprints: number
  processedBlueprints: number
  percentComplete: number
  currentBlueprint: string
  currentBlueprintId: number
  skusScoredSoFar: number
  newSkus: number
  updatedSkus: number
  unchangedSkus: number
  errorsSoFar: number
  apiCallsSoFar: number
  startedAt: string
  lastMessage: string
  estimatedSecondsRemaining: number
}

let currentProgress: SyncProgress | null = null
let syncAborted = false

export function getSyncProgress(): SyncProgress | null {
  return currentProgress
}

export function abortSync(): void {
  syncAborted = true
}

function updateProgress(updates: Partial<SyncProgress>): void {
  if (currentProgress) {
    Object.assign(currentProgress, updates)
  }
}

// ── Data hash for change detection ──

function computeHash(data: any): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return `h:${hash.toString(36)}`
}

// ── Main sync function ──

export async function runSync(
  payload: Payload,
  mode: 'full' | 'incremental' = 'incremental',
  triggeredBy: string = 'admin',
  triggeredByUser: string = '',
): Promise<{ success: boolean; syncId: string; summary: string }> {
  if (currentProgress?.isRunning) {
    return { success: false, syncId: '', summary: 'Sync already in progress' }
  }

  const syncId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const startedAt = new Date().toISOString()
  syncAborted = false

  // Initialize progress
  currentProgress = {
    isRunning: true,
    phase: 'starting',
    totalBlueprints: 0,
    processedBlueprints: 0,
    percentComplete: 0,
    currentBlueprint: '',
    currentBlueprintId: 0,
    skusScoredSoFar: 0,
    newSkus: 0,
    updatedSkus: 0,
    unchangedSkus: 0,
    errorsSoFar: 0,
    apiCallsSoFar: 0,
    startedAt,
    lastMessage: 'Starting sync...',
    estimatedSecondsRemaining: 0,
  }

  // Stats for sync log
  const stats = {
    blueprintsTotal: 0,
    blueprintsProcessed: 0,
    blueprintsSkipped: 0,
    providersProcessed: 0,
    skusScored: 0,
    skusNew: 0,
    skusUpdated: 0,
    skusUnchanged: 0,
    skusRemoved: 0,
    skusError: 0,
    apiCalls: 0,
    apiErrors: 0,
    rateLimitHits: 0,
    changes: [] as any[],
    errors: [] as any[],
  }

  try {
    // ── Step 1: Fetch blueprints ──
    updateProgress({ phase: 'fetching-blueprints', lastMessage: 'Fetching blueprint catalog...' })
    payload.logger.info(`[Sync ${syncId}] Starting ${mode} sync...`)

    await catalogRateLimiter.throttle()
    stats.apiCalls++
    const allBlueprints = await listBlueprints()

    const relevantBlueprints = allBlueprints.filter((bp: any) =>
      TARGET_CATEGORIES.has(categorizeBlueprint(bp.title)),
    )

    stats.blueprintsTotal = relevantBlueprints.length
    updateProgress({
      totalBlueprints: relevantBlueprints.length,
      lastMessage: `Found ${relevantBlueprints.length} relevant blueprints (from ${allBlueprints.length} total)`,
      apiCallsSoFar: stats.apiCalls,
    })

    payload.logger.info(
      `[Sync ${syncId}] ${relevantBlueprints.length} blueprints to process (mode: ${mode})`,
    )

    // ── Step 2: Load existing cache for upsert lookup (both modes) ──
    const existingCache = new Map<string, any>()
    updateProgress({ phase: 'checking-cache', lastMessage: 'Loading existing cache for comparison...' })

    const cached = await payload.find({
      collection: 'printify-catalog-cache' as any,
      limit: 10000,
      depth: 0,
      select: { blueprintId: true, providerId: true, dataHash: true, lastSyncedAt: true },
    })

    for (const doc of cached.docs) {
      const d = doc as any
      existingCache.set(`${d.blueprintId}-${d.providerId}`, d)
    }

    payload.logger.info(`[Sync ${syncId}] Loaded ${existingCache.size} cached entries for comparison`)

    // ── Step 3: Process each blueprint ──
    updateProgress({ phase: 'fetching-variants', lastMessage: 'Processing blueprints...' })
    const processStartTime = Date.now()

    // Track all seen blueprint-provider combos (for detecting removals)
    const seenKeys = new Set<string>()

    for (let i = 0; i < relevantBlueprints.length; i++) {
      if (syncAborted) {
        payload.logger.info(`[Sync ${syncId}] Sync aborted by user`)
        break
      }

      const bp = relevantBlueprints[i]

      updateProgress({
        processedBlueprints: i,
        percentComplete: Math.round((i / relevantBlueprints.length) * 100),
        currentBlueprint: bp.title,
        currentBlueprintId: bp.id,
        lastMessage: `Processing: ${bp.title} (${i + 1}/${relevantBlueprints.length})`,
      })

      try {
        // Fetch providers
        await catalogRateLimiter.throttle()
        stats.apiCalls++
        updateProgress({ apiCallsSoFar: stats.apiCalls })

        const providers = await getProviders(bp.id)
        const topProviders = providers.slice(0, MAX_PROVIDERS_PER_BLUEPRINT)

        // Log first provider's raw decoration_methods to verify format
        if (i === 0 && topProviders.length > 0) {
          payload.logger.info(
            `[Sync] Raw decoration_methods sample (${topProviders[0].title}): ${JSON.stringify(topProviders[0].decoration_methods)}`,
          )
        }

        for (const prov of topProviders) {
          const cacheKey = `${bp.id}-${prov.id}`
          seenKeys.add(cacheKey)

          try {
            // For incremental: check if we need to re-fetch
            if (mode === 'incremental') {
              const existing = existingCache.get(cacheKey)
              if (existing) {
                const lastSync = new Date(existing.lastSyncedAt).getTime()
                const age = Date.now() - lastSync
                if (age < STALE_THRESHOLD_MS) {
                  stats.blueprintsSkipped++
                  stats.skusUnchanged++
                  updateProgress({ unchangedSkus: stats.skusUnchanged })
                  continue // Skip — data is fresh enough
                }
              }
            }

            // Fetch variants + shipping in parallel
            await catalogRateLimiter.throttle()
            stats.apiCalls++

            const [variantsResponse, shippingData] = await Promise.all([
              getVariants(bp.id, prov.id).catch((e: any) => {
                stats.apiErrors++
                return null
              }),
              getShipping(bp.id, prov.id).catch((e: any) => {
                stats.apiErrors++
                return null
              }),
            ])

            stats.apiCalls++ // counted the parallel call
            updateProgress({ apiCallsSoFar: stats.apiCalls })

            const variants = variantsResponse?.variants || []
            if (variants.length === 0) continue

            stats.providersProcessed++

            // Score
            const scored = scoreSku(bp, prov, variants, shippingData)

            // Only store if margin is viable
            if (scored.marginPercent < 25) continue

            // Compute hash for change detection
            const dataHash = computeHash({
              title: bp.title,
              brand: bp.brand,
              providerId: prov.id,
              variantCosts: variants.map((v: any) => v.cost).sort(),
              variantCount: variants.length,
              shipping: shippingData?.profiles?.[0]?.first_item?.cost,
            })

            // Check if data changed
            const existing = existingCache.get(cacheKey)
            const isNew = !existing
            const isChanged = existing && existing.dataHash !== dataHash

            if (!isNew && !isChanged && mode === 'incremental') {
              stats.skusUnchanged++
              updateProgress({ unchangedSkus: stats.skusUnchanged })

              // Still update lastSyncedAt
              await payload.update({
                collection: 'printify-catalog-cache' as any,
                id: existing.id,
                data: { lastSyncedAt: new Date().toISOString() } as any,
              })
              continue
            }

            // Upsert into MongoDB
            const docData: Record<string, any> = {
              blueprintId: scored.blueprintId,
              providerId: scored.providerId,
              blueprintTitle: scored.blueprintTitle,
              blueprintBrand: scored.blueprintBrand,
              blueprintModel: scored.blueprintModel,
              blueprintImages: scored.blueprintImages,
              providerTitle: scored.providerTitle,
              decorationMethods: scored.decorationMethods,
              category: scored.category,
              minCost: scored.minCost,
              maxCost: scored.maxCost,
              shippingCostUs: scored.shippingCostUs,
              handlingTime: scored.handlingTime,
              targetRetail: scored.targetRetail,
              marginPercent: scored.marginPercent,
              profitPerUnit: scored.profitPerUnit,
              totalVariants: scored.totalVariants,
              enabledVariants: scored.enabledVariants,
              availableColors: scored.availableColors,
              brandColorsAvailable: scored.brandColorsAvailable,
              brandColorCount: scored.brandColorCount,
              availableSizes: scored.availableSizes,
              sizeRange: scored.sizeRange,
              printAreaFront: scored.printAreaFront,
              printAreaBack: scored.printAreaBack,
              printAreaCount: scored.printAreaCount,
              score: scored.score,
              scoreBreakdown: scored.scoreBreakdown,
              variants: scored.variants,
              lastSyncedAt: new Date().toISOString(),
              status: 'active',
              lastSyncError: null,
              dataHash,
            }

            if (existing) {
              // Update
              await payload.update({
                collection: 'printify-catalog-cache' as any,
                id: existing.id,
                data: docData as any,
              })

              if (isChanged) {
                stats.skusUpdated++
                stats.changes.push({
                  type: 'updated',
                  blueprintId: bp.id,
                  providerId: prov.id,
                  title: bp.title,
                })
                updateProgress({ updatedSkus: stats.skusUpdated })
              }
            } else {
              // Create
              docData.firstSeenAt = new Date().toISOString()
              docData.syncVersion = 1

              await payload.create({
                collection: 'printify-catalog-cache' as any,
                data: docData as any,
              })

              stats.skusNew++
              stats.changes.push({
                type: 'new',
                blueprintId: bp.id,
                providerId: prov.id,
                title: bp.title,
                score: scored.score,
              })
              updateProgress({ newSkus: stats.skusNew })
            }

            stats.skusScored++
            updateProgress({ skusScoredSoFar: stats.skusScored })
          } catch (provError: any) {
            stats.skusError++
            stats.errors.push({
              blueprintId: bp.id,
              providerId: prov.id,
              error: provError.message,
            })
            updateProgress({ errorsSoFar: stats.skusError })
          }
        }

        stats.blueprintsProcessed++

        // ETA calculation
        const elapsed = (Date.now() - processStartTime) / 1000
        const rate = stats.blueprintsProcessed / elapsed
        const remaining = relevantBlueprints.length - i - 1
        const eta = rate > 0 ? Math.round(remaining / rate) : 0
        updateProgress({ estimatedSecondsRemaining: eta })
      } catch (bpError: any) {
        stats.apiErrors++
        stats.errors.push({
          blueprintId: bp.id,
          error: bpError.message,
        })
      }
    }

    // ── Step 4: Mark discontinued ──
    if (mode === 'full' && !syncAborted) {
      updateProgress({ phase: 'cleanup', lastMessage: 'Checking for discontinued SKUs...' })

      const allCached = await payload.find({
        collection: 'printify-catalog-cache' as any,
        limit: 10000,
        depth: 0,
        where: { status: { equals: 'active' } },
        select: { blueprintId: true, providerId: true },
      })

      for (const doc of allCached.docs) {
        const d = doc as any
        const key = `${d.blueprintId}-${d.providerId}`
        if (!seenKeys.has(key)) {
          await payload.update({
            collection: 'printify-catalog-cache' as any,
            id: d.id,
            data: { status: 'discontinued' } as any,
          })
          stats.skusRemoved++
          stats.changes.push({
            type: 'discontinued',
            blueprintId: d.blueprintId,
            providerId: d.providerId,
          })
        }
      }
    }

    // ── Step 5: Write sync log ──
    updateProgress({ phase: 'saving', lastMessage: 'Writing sync log...' })

    const completedAt = new Date().toISOString()
    const durationMs = Date.now() - new Date(startedAt).getTime()

    await payload.create({
      collection: 'printify-sync-log' as any,
      data: {
        syncId,
        type: mode,
        triggeredBy,
        triggeredByUser,
        startedAt,
        completedAt,
        durationMs,
        status: syncAborted ? 'partial' : 'completed',
        blueprintsTotal: stats.blueprintsTotal,
        blueprintsProcessed: stats.blueprintsProcessed,
        blueprintsSkipped: stats.blueprintsSkipped,
        providersProcessed: stats.providersProcessed,
        skusScored: stats.skusScored,
        skusNew: stats.skusNew,
        skusUpdated: stats.skusUpdated,
        skusUnchanged: stats.skusUnchanged,
        skusRemoved: stats.skusRemoved,
        skusError: stats.skusError,
        apiCalls: stats.apiCalls,
        apiErrors: stats.apiErrors,
        rateLimitHits: stats.rateLimitHits,
        changes: stats.changes.slice(0, 100), // cap at 100 for storage
        syncErrors: stats.errors.slice(0, 50),
      } as any,
    })

    const summary = `${stats.skusNew} new, ${stats.skusUpdated} updated, ${stats.skusUnchanged} unchanged, ${stats.skusRemoved} removed, ${stats.skusError} errors`

    payload.logger.info(
      `[Sync ${syncId}] Completed in ${Math.round(durationMs / 1000)}s — ${summary}`,
    )

    // Done
    updateProgress({
      isRunning: false,
      phase: 'completed',
      processedBlueprints: relevantBlueprints.length,
      percentComplete: 100,
      lastMessage: `Sync completed — ${summary}`,
    })

    return { success: true, syncId, summary }
  } catch (error: any) {
    payload.logger.error(`[Sync ${syncId}] Failed: ${error.message}`)

    updateProgress({
      isRunning: false,
      phase: 'failed',
      lastMessage: `Sync failed: ${error.message}`,
    })

    // Write failure log
    try {
      await payload.create({
        collection: 'printify-sync-log' as any,
        data: {
          syncId,
          type: mode,
          triggeredBy,
          triggeredByUser,
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - new Date(startedAt).getTime(),
          status: 'failed',
          ...stats,
          syncErrors: [...stats.errors, { error: error.message }],
        } as any,
      })
    } catch { /* ignore log write failure */ }

    return { success: false, syncId, summary: error.message }
  }
}
