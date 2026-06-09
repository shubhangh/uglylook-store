import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
})

/**
 * POST /next/create-checkout-session
 *
 * Creates a Stripe Checkout Session from the current cart.
 * Redirects the customer to Stripe's hosted checkout page.
 *
 * Body: {
 *   items: Array<{ productId, variantId?, quantity, title, price, imageUrl? }>
 *   shipping: { firstName, lastName, address, city, state, zip, country, phone }
 *   email: string
 *   cartId?: string
 * }
 */
export async function POST(req: Request): Promise<Response> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  const ip = getClientIP(req)
  const { allowed } = rateLimit(`checkout:${ip}`, 10, 60_000)
  if (!allowed) {
    return Response.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()

    let user: any = null
    try {
      const auth = await payload.auth({ headers: requestHeaders })
      user = auth.user
    } catch { /* guest checkout */ }

    const body = await req.json()
    const { items, shipping, email, cartId } = body

    if (!items?.length) {
      return Response.json({ error: 'No items provided' }, { status: 400 })
    }
    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 })
    }

    // Build Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(item.price), // price already in cents
        product_data: {
          name: item.title,
          ...(item.variantLabel ? { description: item.variantLabel } : {}),
          ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
        },
      },
      quantity: item.quantity || 1,
    }))

    // Build metadata for the webhook to reconstruct the order
    const orderMeta: Record<string, string> = {
      email,
      cartId: cartId || '',
      customerId: user?.id || '',
      shippingFirstName: shipping?.firstName || '',
      shippingLastName: shipping?.lastName || '',
      shippingAddress: shipping?.address || '',
      shippingCity: shipping?.city || '',
      shippingState: shipping?.state || '',
      shippingZip: shipping?.zip || '',
      shippingCountry: shipping?.country || 'US',
      shippingPhone: shipping?.phone || '',
      // Serialize items as JSON (Stripe metadata values are strings, max 500 chars each)
      itemsJson: JSON.stringify(
        items.map((item: any) => ({
          p: item.productId,
          v: item.variantId || null,
          q: item.quantity || 1,
        })),
      ),
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4321'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      metadata: orderMeta,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
    })

    return Response.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('[create-checkout-session] Error:', error)
    return Response.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}
