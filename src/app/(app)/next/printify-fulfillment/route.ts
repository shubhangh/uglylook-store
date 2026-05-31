import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isAtLeastManager } from '@/access/utilities'

/**
 * GET /next/printify-fulfillment
 *
 * Returns fulfillment dashboard data: status counts + recent orders with fulfillment info.
 * Accessible to owner, admin, and manager (read-only).
 *
 * Query params:
 *   status  — filter by fulfillmentStatus (optional)
 *   page    — pagination (default 1)
 *   limit   — per page (default 20, max 100)
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
    const statusFilter = url.searchParams.get('status')
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))

    // Fetch status counts (all statuses in parallel)
    const statuses = [
      'pending',
      'sent_to_printify',
      'in_production',
      'shipped',
      'delivered',
      'cancelled',
      'on_hold',
      'failed',
      'manual',
    ]

    const countPromises = statuses.map(async (status) => {
      const result = await payload.count({
        collection: 'orders',
        where: { fulfillmentStatus: { equals: status } },
      })
      return { status, count: result.totalDocs }
    })

    const counts = await Promise.all(countPromises)
    const statusCounts: Record<string, number> = {}
    for (const { status, count } of counts) {
      statusCounts[status] = count
    }

    // Also count orders without fulfillmentStatus (legacy orders)
    const noStatusResult = await payload.count({
      collection: 'orders',
      where: {
        or: [
          { fulfillmentStatus: { exists: false } },
          { fulfillmentStatus: { equals: null } },
        ],
      },
    })
    statusCounts['no_status'] = noStatusResult.totalDocs

    // Fetch recent orders with fulfillment data
    const where: any = {}
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'no_status') {
        where.or = [
          { fulfillmentStatus: { exists: false } },
          { fulfillmentStatus: { equals: null } },
        ]
      } else {
        where.fulfillmentStatus = { equals: statusFilter }
      }
    }

    const orders = await payload.find({
      collection: 'orders',
      where,
      sort: '-createdAt',
      limit,
      page,
      depth: 1,
      select: {
        items: true,
        status: true,
        amount: true,
        currency: true,
        customerEmail: true,
        createdAt: true,
        fulfillmentStatus: true,
        printifyOrderId: true,
        trackingNumber: true,
        trackingCarrier: true,
        trackingUrl: true,
        fulfillmentNote: true,
      },
    })

    return Response.json({
      statusCounts,
      orders: orders.docs.map((order: any) => ({
        id: order.id,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus || null,
        amount: order.amount,
        currency: order.currency,
        customerEmail: order.customerEmail,
        createdAt: order.createdAt,
        printifyOrderId: order.printifyOrderId || null,
        trackingNumber: order.trackingNumber || null,
        trackingCarrier: order.trackingCarrier || null,
        trackingUrl: order.trackingUrl || null,
        fulfillmentNote: order.fulfillmentNote || null,
        itemCount: order.items?.length || 0,
        itemSummary: order.items
          ?.map((item: any) => {
            const product =
              typeof item.product === 'object' ? item.product : null
            const title = product?.title || 'Unknown Product'
            const variant =
              typeof item.variant === 'object' ? item.variant : null
            const variantLabel = variant?.title || ''
            return `${title}${variantLabel ? ` (${variantLabel})` : ''} ×${item.quantity || 1}`
          })
          .join(', ') || '',
      })),
      totalDocs: orders.totalDocs,
      totalPages: orders.totalPages,
      page: orders.page,
      hasNextPage: orders.hasNextPage,
      hasPrevPage: orders.hasPrevPage,
    })
  } catch (error: any) {
    console.error('Fulfillment dashboard error:', error)
    return Response.json(
      { error: error?.message || 'Failed to load fulfillment data' },
      { status: 500 },
    )
  }
}
