import { getPayload } from 'payload'
import config from '@payload-config'
import type { PrintifyWebhookEvent, PrintifyShipment } from '@/lib/printify'
import { logFulfillment } from '@/lib/fulfillment-log'
import { sendShippedEmail, sendDeliveredEmail } from '@/lib/fulfillment-email'

/**
 * Printify webhook receiver.
 *
 * Printify sends events for:
 * - order:shipping-update — tracking info available
 * - order:status-update   — order status changed
 *
 * Register webhooks via Printify API or the /next/printify-setup route.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })

    // Verify webhook secret — mandatory
    const webhookSecret = process.env.PRINTIFY_WEBHOOK_SECRET
    if (!webhookSecret) {
      payload.logger.error('Printify webhook: PRINTIFY_WEBHOOK_SECRET not configured')
      return Response.json({ error: 'Webhook not configured' }, { status: 500 })
    }
    const signature = req.headers.get('x-printify-webhook-token')
    if (signature !== webhookSecret) {
      payload.logger.warn('Printify webhook: invalid signature')
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: PrintifyWebhookEvent = await req.json()
    payload.logger.info(
      `Printify webhook received: ${event.type} for order ${event.resource?.id}`,
    )

    const printifyOrderId = event.resource?.id
    if (!printifyOrderId) {
      return Response.json({ error: 'No order ID in event' }, { status: 400 })
    }

    // Find our order by printifyOrderId
    const {
      docs: [order],
    } = await payload.find({
      collection: 'orders',
      where: { printifyOrderId: { equals: printifyOrderId } },
      limit: 1,
    })

    if (!order) {
      payload.logger.warn(
        `Printify webhook: no matching order for Printify ID ${printifyOrderId}`,
      )
      // Return 200 anyway so Printify doesn't retry
      return Response.json({ received: true, matched: false })
    }

    const data = event.resource.data

    const customerEmail = (order as any).customerEmail

    switch (event.type) {
      case 'order:shipping-update':
      case 'order:shipment:created':
      case 'order:shipment:delivered': {
        const shipments: PrintifyShipment[] =
          data.shipments || (data as any).shipment ? [data as any] : []

        if (shipments.length > 0) {
          const shipment = shipments[0]
          const isDelivered =
            event.type === 'order:shipment:delivered' || !!shipment.delivered_at

          await logFulfillment(payload, order.id, {
            status: isDelivered ? 'delivered' : 'shipped',
            message: isDelivered
              ? `Delivered at ${shipment.delivered_at || new Date().toISOString()}`
              : `Shipped via ${shipment.carrier || 'carrier'}`,
            source: 'webhook',
            trackingNumber: shipment.number,
            trackingCarrier: shipment.carrier,
            trackingUrl: shipment.url,
          }, isDelivered ? { status: 'completed' } : {})

          // Send email notifications
          if (customerEmail) {
            if (isDelivered) {
              sendDeliveredEmail(payload, { to: customerEmail, orderId: order.id })
            } else {
              sendShippedEmail(payload, {
                to: customerEmail,
                orderId: order.id,
                trackingNumber: shipment.number,
                trackingCarrier: shipment.carrier,
                trackingUrl: shipment.url,
              })
            }
          }

          payload.logger.info(
            `Order ${order.id}: ${isDelivered ? 'delivered' : 'shipped'} — tracking: ${shipment.number || 'n/a'}`,
          )
        }
        break
      }

      case 'order:status-update': {
        const printifyStatus = data.status?.toLowerCase()
        let status = ''
        let message = ''
        let extraData: Record<string, any> = {}

        if (printifyStatus === 'canceled' || printifyStatus === 'cancelled') {
          status = 'cancelled'
          message = 'Cancelled by Printify'
          extraData = { status: 'cancelled' }
        } else if (printifyStatus === 'on-hold') {
          status = 'on_hold'
          message = 'On hold at Printify'
        } else if (printifyStatus === 'in-production' || printifyStatus === 'printing') {
          status = 'in_production'
          message = 'In production at Printify'
        } else if (printifyStatus === 'fulfilled') {
          status = 'shipped'
          message = 'Fulfilled by Printify'
        }

        if (status) {
          await logFulfillment(payload, order.id, {
            status,
            message,
            source: 'webhook',
          }, extraData)
          payload.logger.info(`Order ${order.id} status: ${status}`)
        }
        break
      }

      default:
        payload.logger.info(`Unhandled Printify event type: ${event.type}`)
    }

    return Response.json({ received: true, orderId: order.id })
  } catch (error: any) {
    console.error('Printify webhook error:', error)
    return Response.json(
      { error: error?.message || 'Webhook processing failed' },
      { status: 500 },
    )
  }
}

// Printify may also send GET to verify the endpoint
export async function GET(): Promise<Response> {
  return Response.json({ status: 'ok', service: 'uglylook-printify-webhook' })
}
