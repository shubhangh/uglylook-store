import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import {
  listShops,
  listProducts,
  listWebhooks,
  registerWebhook,
} from '@/lib/printify'
import { isOwnerOrAdmin } from '@/access/utilities'

/**
 * Printify setup & diagnostics endpoint.
 *
 * GET  /next/printify-setup         — Show connection status, shops, products, webhooks
 * POST /next/printify-setup         — Register webhooks with Printify
 *
 * Requires owner/admin auth.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const result: Record<string, any> = {
      configured: Boolean(
        process.env.PRINTIFY_API_TOKEN && process.env.PRINTIFY_SHOP_ID,
      ),
      shopId: process.env.PRINTIFY_SHOP_ID || null,
    }

    if (!result.configured) {
      return Response.json({
        ...result,
        error:
          'Set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID in your .env file',
      })
    }

    // Test connection
    try {
      result.shops = await listShops()
    } catch (e: any) {
      result.shopsError = e.message
    }

    // List products
    try {
      const productsResponse = await listProducts(1, 10)
      result.products = {
        total: productsResponse.total,
        sample: productsResponse.data.map((p: any) => ({
          id: p.id,
          title: p.title,
          variants: p.variants?.length || 0,
        })),
      }
    } catch (e: any) {
      result.productsError = e.message
    }

    // List webhooks
    try {
      result.webhooks = await listWebhooks()
    } catch (e: any) {
      result.webhooksError = e.message
    }

    return Response.json(result)
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (
      !process.env.PRINTIFY_API_TOKEN ||
      !process.env.PRINTIFY_SHOP_ID
    ) {
      return Response.json(
        { error: 'Printify not configured' },
        { status: 400 },
      )
    }

    const body = await req.json()
    const webhookBaseUrl =
      body.webhookBaseUrl ||
      process.env.NEXT_PUBLIC_SERVER_URL ||
      'http://localhost:4321'

    const webhookUrl = `${webhookBaseUrl}/next/printify-webhook`

    // Register webhooks for all relevant events
    const topics = [
      'order:created',
      'order:updated',
      'order:shipping-update',
      'order:shipment:created',
      'order:shipment:delivered',
    ]

    const results: any[] = []

    for (const topic of topics) {
      try {
        const wh = await registerWebhook(topic, webhookUrl)
        results.push({ topic, status: 'registered', id: wh.id })
      } catch (e: any) {
        results.push({ topic, status: 'error', message: e.message })
      }
    }

    return Response.json({
      webhookUrl,
      results,
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
