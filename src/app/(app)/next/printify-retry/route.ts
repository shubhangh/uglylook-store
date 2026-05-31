import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'
import {
  createOrder,
  sendToProduction,
  getOrder as getPrintifyOrder,
  buildBlueprintLineItem,
  type PrintifyConfig,
  type BlueprintLineItem,
  type PrintifyAddress,
  type PrintifyOrderPayload,
} from '@/lib/printify'
import { logFulfillment } from '@/lib/fulfillment-log'
import { toCountryCode } from '@/lib/country-codes'

/**
 * POST /next/printify-retry
 *
 * Retry pushing a failed order to Printify (blueprint-direct), or re-sync status.
 *
 * Body: { orderId: string, action: "retry" | "sync" }
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { orderId, action = 'retry' } = await req.json()

    if (!orderId) {
      return Response.json({ error: 'orderId required' }, { status: 400 })
    }

    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 2,
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    // ── Sync: Pull latest status from Printify ──
    if (action === 'sync') {
      const printifyOrderId = (order as any).printifyOrderId
      if (!printifyOrderId) {
        return Response.json(
          { error: 'No Printify order ID on this order' },
          { status: 400 },
        )
      }

      const printifyOrder = await getPrintifyOrder(printifyOrderId)

      const pStatus = printifyOrder.status?.toLowerCase()
      let fulfillmentStatus = ''
      let extraData: Record<string, any> = {}

      if (pStatus === 'fulfilled' || pStatus === 'shipped') fulfillmentStatus = 'shipped'
      else if (pStatus === 'canceled' || pStatus === 'cancelled') {
        fulfillmentStatus = 'cancelled'
        extraData = { status: 'cancelled' }
      } else if (pStatus === 'in-production' || pStatus === 'printing') fulfillmentStatus = 'in_production'
      else if (pStatus === 'on-hold') fulfillmentStatus = 'on_hold'

      const shipment = printifyOrder.shipments?.[0]
      if (shipment?.delivered_at) {
        fulfillmentStatus = 'delivered'
        extraData = { status: 'completed' }
      }

      await logFulfillment(payload, orderId, {
        status: fulfillmentStatus || (order as any).fulfillmentStatus || 'pending',
        message: `Synced from Printify. Printify status: ${printifyOrder.status}`,
        source: 'sync',
        trackingNumber: shipment?.number,
        trackingCarrier: shipment?.carrier,
        trackingUrl: shipment?.url,
      }, extraData)

      return Response.json({
        success: true,
        printifyStatus: printifyOrder.status,
        fulfillmentStatus,
      })
    }

    // ── Retry: Re-push order to Printify (blueprint-direct) ──
    if ((order as any).printifyOrderId) {
      return Response.json(
        {
          error:
            'Order already has a Printify ID. Use action="sync" to refresh status.',
        },
        { status: 400 },
      )
    }

    const lineItems: BlueprintLineItem[] = []

    for (const item of order.items || []) {
      const product =
        typeof item.product === 'object' ? item.product : null
      if (!product) continue

      const config: PrintifyConfig | null = (product as any).printifyConfig
      if (!config?.blueprintId || !config?.providerId || !config?.designUrl) {
        continue
      }

      // Try to resolve variant key
      let variantKey: string | null = null
      if (item.variant && typeof item.variant === 'object') {
        const variant = item.variant as any
        // Try title-based key
        if (variant.title) {
          variantKey = variant.title.replace(/\s*\/\s*/g, '_').replace(/\s+/g, '_')
        }
        // Fallback: direct printifyVariantId on variant
        if (!variantKey && variant.printifyVariantId) {
          lineItems.push({
            blueprint_id: config.blueprintId,
            print_provider_id: config.providerId,
            variant_id: Number(variant.printifyVariantId),
            quantity: item.quantity || 1,
            print_areas: {
              [config.placement?.position || 'front']: config.designUrl,
            },
          })
          continue
        }
      }

      if (variantKey && config.variantMap) {
        const blueprintItem = buildBlueprintLineItem(
          config,
          variantKey,
          item.quantity || 1,
        )
        if (blueprintItem) {
          lineItems.push(blueprintItem)
          continue
        }
        // Case-insensitive fallback
        const matchedKey = Object.keys(config.variantMap).find(
          (k) => k.toLowerCase() === variantKey!.toLowerCase(),
        )
        if (matchedKey) {
          const fallbackItem = buildBlueprintLineItem(
            config,
            matchedKey,
            item.quantity || 1,
          )
          if (fallbackItem) {
            lineItems.push(fallbackItem)
            continue
          }
        }
      }

      // No variant — use first in map
      if (!item.variant && config.variantMap) {
        const firstKey = Object.keys(config.variantMap)[0]
        if (firstKey) {
          const fallbackItem = buildBlueprintLineItem(
            config,
            firstKey,
            item.quantity || 1,
          )
          if (fallbackItem) {
            lineItems.push(fallbackItem)
            continue
          }
        }
      }
    }

    if (lineItems.length === 0) {
      return Response.json(
        { error: 'No items with valid Printify config or variant mapping found' },
        { status: 400 },
      )
    }

    const shipping = (order as any).shippingAddress || {}
    const addressTo: PrintifyAddress = {
      first_name: shipping.firstName || '',
      last_name: shipping.lastName || '',
      email: (order as any).customerEmail || '',
      phone: shipping.phone || '',
      country: toCountryCode(shipping.country || 'US'),
      region: shipping.state || shipping.region || '',
      address1: shipping.addressLine1 || '',
      address2: shipping.addressLine2 || '',
      city: shipping.city || '',
      zip: shipping.postalCode || '',
    }

    const orderPayload: PrintifyOrderPayload = {
      external_id: order.id,
      label: `UglyLook #${order.id}`,
      line_items: lineItems,
      shipping_method: 1,
      is_printify_express: false,
      send_shipping_notification: false,
      address_to: addressTo,
    }

    const printifyOrder = await createOrder(orderPayload)

    try {
      await sendToProduction(printifyOrder.id)
    } catch {
      // May auto-send
    }

    await logFulfillment(payload, orderId, {
      status: 'sent_to_printify',
      message: `Retry successful (blueprint-direct). Printify order: ${printifyOrder.id}`,
      source: 'retry',
    }, { printifyOrderId: printifyOrder.id })

    return Response.json({
      success: true,
      printifyOrderId: printifyOrder.id,
    })
  } catch (error: any) {
    console.error('Printify retry error:', error)
    return Response.json(
      { error: error?.message || 'Retry failed' },
      { status: 500 },
    )
  }
}
