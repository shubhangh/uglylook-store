import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isAtLeastManager } from '@/access/utilities'
import { getSyncProgress } from '@/lib/printify-sync'

/**
 * GET /next/printify-sync-status
 *
 * Returns current sync progress + last sync info.
 * Polled by the Catalog Browser UI every 2 seconds during sync.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isAtLeastManager(user)) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const progress = getSyncProgress()

    // Get last completed sync from log
    const lastSync = await payload.find({
      collection: 'printify-sync-log' as any,
      limit: 1,
      sort: '-completedAt',
      where: { status: { in: ['completed', 'partial'] } },
      depth: 0,
    })

    const lastSyncDoc = lastSync.docs[0] as any

    // Get total cached SKUs
    const cacheCount = await payload.count({
      collection: 'printify-catalog-cache' as any,
      where: { status: { equals: 'active' } },
    })

    return Response.json({
      progress: progress || {
        isRunning: false,
        phase: 'idle',
        lastMessage: 'No sync running',
      },
      lastSync: lastSyncDoc
        ? {
            syncId: lastSyncDoc.syncId,
            type: lastSyncDoc.type,
            status: lastSyncDoc.status,
            completedAt: lastSyncDoc.completedAt,
            durationMs: lastSyncDoc.durationMs,
            skusScored: lastSyncDoc.skusScored,
            skusNew: lastSyncDoc.skusNew,
            skusUpdated: lastSyncDoc.skusUpdated,
            skusUnchanged: lastSyncDoc.skusUnchanged,
          }
        : null,
      cachedSkus: cacheCount.totalDocs,
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
