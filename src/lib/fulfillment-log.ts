import type { Payload } from 'payload'

export interface FulfillmentEntry {
  status: string
  message: string
  source: 'push' | 'webhook' | 'retry' | 'sync' | 'manual'
  trackingNumber?: string
  trackingCarrier?: string
  trackingUrl?: string
  timestamp: string
}

/**
 * Appends an entry to the order's fulfillmentHistory array.
 * Also updates fulfillmentStatus and fulfillmentNote for quick reference.
 * Uses context.bypassLock since fulfillment fields aren't locked.
 */
export async function logFulfillment(
  payload: Payload,
  orderId: string,
  entry: Omit<FulfillmentEntry, 'timestamp'>,
  extraData?: Record<string, any>,
): Promise<void> {
  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
  })

  const history = (order as any).fulfillmentHistory || []

  const fullEntry: FulfillmentEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }

  await payload.update({
    collection: 'orders',
    id: orderId,
    context: { bypassLock: true },
    data: {
      fulfillmentStatus: entry.status,
      fulfillmentNote: entry.message,
      fulfillmentHistory: [...history, fullEntry],
      ...(entry.trackingNumber ? { trackingNumber: entry.trackingNumber } : {}),
      ...(entry.trackingCarrier ? { trackingCarrier: entry.trackingCarrier } : {}),
      ...(entry.trackingUrl ? { trackingUrl: entry.trackingUrl } : {}),
      ...extraData,
    } as any,
  })
}
