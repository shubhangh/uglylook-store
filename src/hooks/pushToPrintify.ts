import type { CollectionAfterChangeHook } from 'payload'
import {
  createOrder,
  sendToProduction,
  buildBlueprintLineItem,
  type PrintifyConfig,
  type BlueprintLineItem,
  type PrintifyAddress,
  type PrintifyOrderPayload,
} from '@/lib/printify'
import { logFulfillment } from '@/lib/fulfillment-log'
import { toCountryCode } from '@/lib/country-codes'

/**
 * After an order is created, push it to Printify using blueprint-direct format.
 *
 * Reads each product's `printifyConfig` JSON field to build line items.
 * No Printify product creation needed — orders go straight to production.
 *
 * Skips if:
 * - Not a create operation
 * - Order already has a printifyOrderId
 * - Printify env vars not configured
 * - No items with printifyConfig
 */
export const pushToPrintify: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  if (!process.env.PRINTIFY_API_TOKEN || !process.env.PRINTIFY_SHOP_ID) {
    req.payload.logger.warn('Printify not configured — skipping fulfillment push')
    return doc
  }

  if (doc.printifyOrderId) return doc
  if (!doc.items?.length) {
    req.payload.logger.warn(`[pushToPrintify] Order ${doc.id} has no items (keys: ${Object.keys(doc).join(', ')})`)
    return doc
  }

  req.payload.logger.info(`[pushToPrintify] Order ${doc.id} has ${doc.items.length} items`)

  try {
    const lineItems: BlueprintLineItem[] = []

    for (const item of doc.items) {
      const rawProductId = typeof item.product === 'object' ? (item.product?.id || item.product?._id) : item.product
      const productId = String(rawProductId)
      if (!productId || productId === 'undefined') continue

      req.payload.logger.info(`[pushToPrintify] Resolving product ${productId} (raw type: ${typeof rawProductId})`)

      const product = await req.payload.findByID({
        collection: 'products',
        id: productId,
        depth: 1,
      })

      const config: PrintifyConfig | null = (product as any).printifyConfig
      if (!config?.blueprintId || !config?.providerId || !config?.designUrl) {
        req.payload.logger.warn(
          `Product ${productId} missing printifyConfig (has: bp=${config?.blueprintId} prov=${config?.providerId} design=${!!config?.designUrl}) — skipping item`,
        )
        continue
      }

      // Resolve variant key from the order's variant
      let variantKey: string | null = null

      // Fetch the variant doc directly for reliable data
      const variantRef = item.variant
      const variantId = typeof variantRef === 'object'
        ? (variantRef as any)?.id || (variantRef as any)?._id
        : variantRef
      let variantDoc: any = null

      if (variantId) {
        try {
          variantDoc = await req.payload.findByID({
            collection: 'variants',
            id: String(variantId),
            depth: 1,
          })
        } catch { /* variant not found */ }
      }

      // If variant has a direct printifyVariantId, use it immediately
      if (variantDoc?.printifyVariantId) {
        lineItems.push({
          blueprint_id: config.blueprintId,
          print_provider_id: config.providerId,
          variant_id: Number(variantDoc.printifyVariantId),
          quantity: item.quantity || 1,
          print_areas: {
            [config.placement?.position || 'front']: config.designUrl,
          },
        })
        continue
      }

      // Build variant key from option labels (e.g., "Black_M")
      if (variantDoc?.options?.length) {
        const optionLabels: string[] = []
        for (const opt of variantDoc.options) {
          const option = typeof opt === 'object' ? opt : null
          if (option?.label) optionLabels.push(option.label)
          else if (option?.title) optionLabels.push(option.title)
        }
        if (optionLabels.length > 0) {
          variantKey = optionLabels.join('_')
        }
      }

      // Fallback: parse variant title (e.g., "Product Name — Black / M" or "Product Name — Large")
      if (!variantKey && variantDoc?.title) {
        const title = variantDoc.title as string
        // Strip product name prefix (before — or -)
        const afterDash = title.includes('—') ? title.split('—').pop()!.trim()
          : title.includes(' - ') ? title.split(' - ').pop()!.trim()
          : title
        variantKey = afterDash.replace(/\s*\/\s*/g, '_').replace(/\s+/g, '_')
      }

      req.payload.logger.info(`[pushToPrintify] Variant key resolved: "${variantKey}" (from variant ${variantId})`)

      // Try to match variant key against variantMap
      if (variantKey && config.variantMap) {
        const mapKeys = Object.keys(config.variantMap)

        // 1. Exact match
        if (config.variantMap[variantKey]) {
          lineItems.push(buildBlueprintLineItem(config, variantKey, item.quantity || 1)!)
          continue
        }

        // 2. Case-insensitive match
        const ciMatch = mapKeys.find((k) => k.toLowerCase() === variantKey!.toLowerCase())
        if (ciMatch) {
          lineItems.push(buildBlueprintLineItem(config, ciMatch, item.quantity || 1)!)
          continue
        }

        // 3. Normalize size names (Large→L, Small→S, etc.) and retry
        const sizeNorm: Record<string, string> = {
          'small': 'S', 'medium': 'M', 'large': 'L',
          'x-large': 'XL', 'xlarge': 'XL', 'extra large': 'XL',
          '2x-large': '2XL', '2xlarge': '2XL', '3x-large': '3XL',
          'one size': 'One size',
        }
        let normalizedKey = variantKey
        for (const [full, abbr] of Object.entries(sizeNorm)) {
          normalizedKey = normalizedKey.replace(new RegExp(full, 'gi'), abbr)
        }
        if (normalizedKey !== variantKey) {
          const normMatch = mapKeys.find((k) => k.toLowerCase() === normalizedKey.toLowerCase())
          if (normMatch) {
            lineItems.push(buildBlueprintLineItem(config, normMatch, item.quantity || 1)!)
            continue
          }
        }

        // 4. Partial match — key is just a size, find first map entry ending with that size
        const partialMatch = mapKeys.find((k) => {
          const parts = k.split('_')
          const lastPart = parts[parts.length - 1].toLowerCase()
          return lastPart === normalizedKey.toLowerCase() || lastPart === variantKey!.toLowerCase()
        })
        if (partialMatch) {
          req.payload.logger.info(`[pushToPrintify] Partial match: "${variantKey}" → "${partialMatch}"`)
          lineItems.push(buildBlueprintLineItem(config, partialMatch, item.quantity || 1)!)
          continue
        }
      }

      // If no variant (product without variants), use first variant in map
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

      req.payload.logger.warn(
        `Product ${productId}: could not resolve Printify variant for key "${variantKey}" — skipping`,
      )
    }

    if (lineItems.length === 0) {
      req.payload.logger.warn(
        `Order ${doc.id}: No items with valid Printify config — skipping fulfillment`,
      )
      await logFulfillment(req.payload, doc.id, {
        status: 'manual',
        message: 'No items have printifyConfig or variant mapping. Requires manual fulfillment.',
        source: 'push',
      })
      return doc
    }

    // Build shipping address
    const shipping = doc.shippingAddress || {}
    const addressTo: PrintifyAddress = {
      first_name: shipping.firstName || '',
      last_name: shipping.lastName || '',
      email: doc.customerEmail || '',
      phone: shipping.phone || '',
      country: toCountryCode(shipping.country || 'US'),
      region: shipping.state || shipping.region || '',
      address1: shipping.addressLine1 || '',
      address2: shipping.addressLine2 || '',
      city: shipping.city || '',
      zip: shipping.postalCode || shipping.zip || '',
    }

    const orderPayload: PrintifyOrderPayload = {
      external_id: doc.id,
      label: `UglyLook #${doc.id}`,
      line_items: lineItems,
      shipping_method: 1,
      is_printify_express: false,
      send_shipping_notification: false,
      address_to: addressTo,
    }

    req.payload.logger.info(`Pushing order ${doc.id} to Printify (blueprint-direct)...`)

    const printifyOrder = await createOrder(orderPayload)

    req.payload.logger.info(
      `Printify order created: ${printifyOrder.id} for order ${doc.id}`,
    )

    // Send to production
    try {
      await sendToProduction(printifyOrder.id)
      req.payload.logger.info(
        `Printify order ${printifyOrder.id} sent to production`,
      )
    } catch (prodError: any) {
      req.payload.logger.warn(
        `Could not send to production (may be auto-sent): ${prodError.message}`,
      )
    }

    await logFulfillment(req.payload, doc.id, {
      status: 'sent_to_printify',
      message: `Sent to Printify (blueprint-direct). Printify order: ${printifyOrder.id}`,
      source: 'push',
    }, { printifyOrderId: printifyOrder.id })
  } catch (error: any) {
    req.payload.logger.error(
      `Failed to push order ${doc.id} to Printify: ${error.message}`,
    )

    await logFulfillment(req.payload, doc.id, {
      status: 'failed',
      message: `Printify push failed: ${error.message}`,
      source: 'push',
    })
  }

  return doc
}
