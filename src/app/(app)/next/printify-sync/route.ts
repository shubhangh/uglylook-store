import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'
import { runSync, getSyncProgress, abortSync } from '@/lib/printify-sync'

/**
 * POST /next/printify-sync
 *
 * Triggers a catalog sync in the background.
 * Body: { mode: "full" | "incremental" }
 *
 * DELETE /next/printify-sync
 * Aborts a running sync.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const progress = getSyncProgress()
    if (progress?.isRunning) {
      return Response.json(
        { error: 'Sync already in progress', progress },
        { status: 409 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const requestedMode = body.mode
    const clearFirst = requestedMode === 'clear-resync'
    const mode = requestedMode === 'full' || clearFirst ? 'full' : 'incremental'
    const userEmail = (user as any)?.email || ''

    // Clear all cached catalog data before resyncing
    if (clearFirst) {
      await payload.db.deleteMany({ collection: 'printify-catalog-cache', req: {} as any, where: {} })
      payload.logger.info(`[Sync] Cleared all cached catalog entries before resync`)
    }

    // Run sync in background — don't await
    runSync(payload, mode, 'admin', userEmail).catch((err) => {
      payload.logger.error(`Background sync error: ${err.message}`)
    })

    return Response.json({
      started: true,
      mode,
      cleared: clearFirst,
      message: `${clearFirst ? 'Cache cleared. ' : ''}${mode} sync started in background. Poll /next/printify-sync-status for progress.`,
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    abortSync()
    return Response.json({ aborted: true })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
