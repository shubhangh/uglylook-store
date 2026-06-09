import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin, isAtLeastManager } from '@/access/utilities'
import { logFulfillment } from '@/lib/fulfillment-log'
import { sendShippedEmail, sendDeliveredEmail } from '@/lib/fulfillment-email'

// Tracking URL builders per carrier
const TRACKING_URLS: Record<string, (num: string) => string> = {
  usps: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
  ups: (n) => `https://www.ups.com/track?tracknum=${n}`,
  fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  dhl: (n) => `https://www.dhl.com/en/express/tracking.html?AWB=${n}`,
}

/**
 * GET /next/fulfillment-queue
 *
 * List orders needing manual fulfillment.
 * Query params:
 *   status — filter: pending (default), packed, shipped, delivered, all
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isAtLeastManager(user)) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const url = new URL(req.url)
    const statusFilter = url.searchParams.get('status') || 'pending'

    // Build where clause
    const where: any = {
      fulfillmentSource: { in: ['self', 'mixed'] },
    }

    switch (statusFilter) {
      case 'pending':
        where.fulfillmentStatus = { equals: 'pending' }
        break
      case 'packed':
        where.fulfillmentStatus = { equals: 'in_production' }
        break
      case 'shipped':
        where.fulfillmentStatus = { equals: 'shipped' }
        break
      case 'delivered':
        where.fulfillmentStatus = { equals: 'delivered' }
        break
      case 'all':
        // No status filter
        break
      default:
        // Default: show actionable orders
        where.fulfillmentStatus = { in: ['pending', 'in_production'] }
    }

    const orders = await payload.find({
      collection: 'orders',
      where,
      sort: '-createdAt',
      limit: 50,
      depth: 2,
    })

    // Count by status for tabs
    const counts = await Promise.all([
      payload.count({
        collection: 'orders',
        where: { fulfillmentSource: { in: ['self', 'mixed'] }, fulfillmentStatus: { equals: 'pending' } },
      }),
      payload.count({
        collection: 'orders',
        where: { fulfillmentSource: { in: ['self', 'mixed'] }, fulfillmentStatus: { equals: 'in_production' } },
      }),
      payload.count({
        collection: 'orders',
        where: { fulfillmentSource: { in: ['self', 'mixed'] }, fulfillmentStatus: { equals: 'shipped' } },
      }),
      payload.count({
        collection: 'orders',
        where: { fulfillmentSource: { in: ['self', 'mixed'] }, fulfillmentStatus: { equals: 'delivered' } },
      }),
    ])

    return Response.json({
      orders: orders.docs,
      total: orders.totalDocs,
      counts: {
        pending: counts[0].totalDocs,
        packed: counts[1].totalDocs,
        shipped: counts[2].totalDocs,
        delivered: counts[3].totalDocs,
      },
    })
  } catch (error: any) {
    console.error('[fulfillment-queue] GET error:', error)
    return Response.json({ error: error?.message || 'Failed to fetch queue' }, { status: 500 })
  }
}

/**
 * POST /next/fulfillment-queue
 *
 * Actions: pack, ship, deliver
 * Body: { action, orderId, carrier?, trackingNumber?, notes? }
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isAtLeastManager(user)) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await req.json()
    const { action, orderId, carrier, trackingNumber, notes } = body

    if (!orderId || !action) {
      return Response.json({ error: 'orderId and action required' }, { status: 400 })
    }

    // Fetch the order
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 2,
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    const orderAny = order as any

    if (!['self', 'mixed'].includes(orderAny.fulfillmentSource || '')) {
      return Response.json({ error: 'Order is not self-fulfilled' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const userId = (user as any)?.id || null

    switch (action) {
      case 'pack': {
        if (orderAny.fulfillmentStatus !== 'pending') {
          return Response.json({ error: `Cannot pack — current status is "${orderAny.fulfillmentStatus}"` }, { status: 400 })
        }

        await payload.update({
          collection: 'orders',
          id: orderId,
          data: {
            fulfillmentStatus: 'in_production',
            selfFulfillment: {
              ...orderAny.selfFulfillment,
              packedAt: now,
              packedBy: userId,
              ...(notes ? { notes } : {}),
            },
          },
        })

        await logFulfillment(payload, orderId, {
          status: 'in_production',
          message: `Packed by ${(user as any)?.email || 'admin'}${notes ? ` — ${notes}` : ''}`,
          source: 'manual',
        })

        return Response.json({ success: true, status: 'in_production' })
      }

      case 'ship': {
        if (!['pending', 'in_production'].includes(orderAny.fulfillmentStatus)) {
          return Response.json({ error: `Cannot ship — current status is "${orderAny.fulfillmentStatus}"` }, { status: 400 })
        }

        if (!trackingNumber) {
          return Response.json({ error: 'Tracking number required' }, { status: 400 })
        }

        const trackingUrl = carrier && TRACKING_URLS[carrier]
          ? TRACKING_URLS[carrier](trackingNumber)
          : ''

        await payload.update({
          collection: 'orders',
          id: orderId,
          data: {
            fulfillmentStatus: 'shipped',
            trackingNumber,
            trackingCarrier: carrier || '',
            trackingUrl,
            selfFulfillment: {
              ...orderAny.selfFulfillment,
              packedAt: orderAny.selfFulfillment?.packedAt || now,
              packedBy: orderAny.selfFulfillment?.packedBy || userId,
              shippedAt: now,
              shippedBy: userId,
              carrier: carrier || undefined,
              ...(notes ? { notes: [orderAny.selfFulfillment?.notes, notes].filter(Boolean).join('\n') } : {}),
            },
          },
        })

        await logFulfillment(payload, orderId, {
          status: 'shipped',
          message: `Shipped via ${carrier || 'unknown'} — ${trackingNumber}`,
          source: 'manual',
          trackingNumber,
          trackingCarrier: carrier,
          trackingUrl,
        })

        // Send shipped email
        try {
          await sendShippedEmail(payload, {
            to: orderAny.customerEmail,
            orderId,
            trackingNumber,
            trackingCarrier: carrier || '',
            trackingUrl,
          })
        } catch (emailErr: any) {
          payload.logger.warn(`[fulfillment-queue] Failed to send shipped email: ${emailErr.message}`)
        }

        return Response.json({ success: true, status: 'shipped', trackingUrl })
      }

      case 'deliver': {
        if (orderAny.fulfillmentStatus !== 'shipped') {
          return Response.json({ error: `Cannot mark delivered — current status is "${orderAny.fulfillmentStatus}"` }, { status: 400 })
        }

        await payload.update({
          collection: 'orders',
          id: orderId,
          data: {
            fulfillmentStatus: 'delivered',
            selfFulfillment: {
              ...orderAny.selfFulfillment,
              deliveredAt: now,
            },
          },
        })

        await logFulfillment(payload, orderId, {
          status: 'delivered',
          message: `Marked as delivered by ${(user as any)?.email || 'admin'}`,
          source: 'manual',
        })

        // Send delivered email
        try {
          await sendDeliveredEmail(payload, {
            to: orderAny.customerEmail,
            orderId,
          })
        } catch (emailErr: any) {
          payload.logger.warn(`[fulfillment-queue] Failed to send delivered email: ${emailErr.message}`)
        }

        return Response.json({ success: true, status: 'delivered' })
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[fulfillment-queue] POST error:', error)
    return Response.json({ error: error?.message || 'Failed to process action' }, { status: 500 })
  }
}
