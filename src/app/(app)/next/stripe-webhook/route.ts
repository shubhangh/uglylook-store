import { getPayload } from 'payload'
import config from '@payload-config'
import Stripe from 'stripe'
import { sendOrderConfirmationEmail, sendCrewOrderAlert } from '@/lib/order-emails'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
})

/**
 * POST /next/stripe-webhook
 *
 * Handles Stripe webhook events. Primary event: checkout.session.completed
 * Creates Order + Transaction in Payload when payment succeeds.
 *
 * For local testing: stripe listen --forward-to localhost:4321/next/stripe-webhook
 */
export async function POST(req: Request): Promise<Response> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured')
    return Response.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return Response.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message)
    return Response.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') {
      console.log('[stripe-webhook] Session not paid yet, skipping:', session.id)
      return Response.json({ received: true })
    }

    try {
      await handleCheckoutCompleted(session)
    } catch (err: any) {
      console.error('[stripe-webhook] Failed to process checkout:', err)
      return Response.json({ error: err.message }, { status: 500 })
    }
  }

  return Response.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const payload = await getPayload({ config })
  const meta = session.metadata || {}

  // Check if order already exists for this session (idempotency)
  const existing = await payload.find({
    collection: 'orders',
    where: { 'stripeSessionId': { equals: session.id } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    payload.logger.info(`[stripe-webhook] Order already exists for session ${session.id}, skipping`)
    return
  }

  // Parse items from metadata
  let orderItems: { product: string; variant?: string; quantity: number }[] = []
  try {
    const parsed = JSON.parse(meta.itemsJson || '[]')
    orderItems = parsed.map((item: any) => ({
      product: item.p,
      ...(item.v ? { variant: item.v } : {}),
      quantity: item.q || 1,
    }))
  } catch {
    payload.logger.error('[stripe-webhook] Failed to parse itemsJson from metadata')
  }

  if (orderItems.length === 0) {
    throw new Error('No items in checkout session metadata')
  }

  // Validate all items exist in DB before creating order
  const validatedItems: typeof orderItems = []
  for (const item of orderItems) {
    try {
      const product = await payload.findByID({ collection: 'products', id: item.product, depth: 0 })
      if (!product) {
        payload.logger.warn(`[stripe-webhook] Product ${item.product} not found, skipping`)
        continue
      }
      if (item.variant) {
        const variant = await payload.findByID({ collection: 'variants', id: item.variant, depth: 0 })
        if (!variant) {
          payload.logger.warn(`[stripe-webhook] Variant ${item.variant} not found, skipping`)
          continue
        }
      }
      validatedItems.push(item)
    } catch {
      payload.logger.warn(`[stripe-webhook] Failed to validate item ${item.product}`)
      continue
    }
  }

  if (validatedItems.length === 0) {
    throw new Error('No valid items found in database')
  }
  orderItems = validatedItems

  const customerEmail = meta.email || session.customer_email || ''
  const totalAmount = session.amount_total || 0 // in cents

  const shippingAddress = {
    firstName: meta.shippingFirstName || '',
    lastName: meta.shippingLastName || '',
    addressLine1: meta.shippingAddress || '',
    city: meta.shippingCity || '',
    state: meta.shippingState || '',
    postalCode: meta.shippingZip || '',
    country: meta.shippingCountry || 'US',
    phone: meta.shippingPhone || '',
  }

  const customerId = meta.customerId || null

  // Determine fulfillment source from product types
  const fulfillmentTypes = new Set<string>()
  for (const item of orderItems) {
    try {
      const product = await payload.findByID({ collection: 'products', id: item.product, depth: 0 })
      fulfillmentTypes.add((product as any)?.fulfillmentType || 'pod')
    } catch {
      fulfillmentTypes.add('pod') // default if product not found
    }
  }
  let fulfillmentSource: 'pod' | 'self' | 'mixed' = 'pod'
  if (fulfillmentTypes.size > 1) fulfillmentSource = 'mixed'
  else if (fulfillmentTypes.has('self')) fulfillmentSource = 'self'

  // Create transaction
  const transaction = await payload.create({
    collection: 'transactions',
    data: {
      status: 'succeeded',
      amount: totalAmount,
      currency: 'USD',
      ...(customerId ? { customer: customerId } : {}),
      customerEmail,
      billingAddress: shippingAddress,
      ...(meta.cartId ? { cart: meta.cartId } : {}),
      items: orderItems,
      paymentMethod: 'stripe',
    },
  })

  // Create order
  const order = await payload.create({
    collection: 'orders',
    data: {
      status: 'processing',
      amount: totalAmount,
      currency: 'USD',
      ...(customerId ? { customer: customerId } : {}),
      customerEmail,
      shippingAddress,
      items: orderItems,
      transactions: [transaction.id],
      stripeSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || '',
      fulfillmentSource,
    },
  })

  // Link transaction → order
  await payload.update({
    collection: 'transactions',
    id: transaction.id,
    data: { order: order.id },
    context: { bypassLock: true },
  })

  // Mark cart as purchased
  if (meta.cartId) {
    try {
      await payload.update({
        collection: 'carts',
        id: meta.cartId,
        data: { purchasedAt: new Date().toISOString() },
      })
    } catch { /* cart might not exist for guest */ }
  }

  payload.logger.info(
    `[stripe-webhook] Order ${order.id} created from Stripe session ${session.id} — $${(totalAmount / 100).toFixed(2)}`,
  )

  // Send order emails (fire and forget)
  // Resolve item titles for the email
  const emailItems: Array<{ title: string; variant: string; quantity: number; price: number }> = []
  for (const item of orderItems) {
    try {
      const product = await payload.findByID({ collection: 'products', id: item.product, depth: 0 })
      let variantLabel = ''
      if (item.variant) {
        const variant = await payload.findByID({ collection: 'variants', id: item.variant, depth: 0 })
        variantLabel = (variant as any)?.title?.replace(`${(product as any)?.title} — `, '') || ''
      }
      emailItems.push({
        title: (product as any)?.title || 'Product',
        variant: variantLabel,
        quantity: item.quantity,
        price: (item as any).variant
          ? ((await payload.findByID({ collection: 'variants', id: item.variant!, depth: 0 })) as any)?.priceInUSD || 0
          : (product as any)?.priceInUSD || 0,
      })
    } catch {
      emailItems.push({ title: 'Product', variant: '', quantity: item.quantity, price: 0 })
    }
  }

  const emailData = {
    to: customerEmail,
    orderId: order.id,
    amount: totalAmount,
    items: emailItems,
    shipping: {
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      address: shippingAddress.addressLine1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.postalCode,
      country: shippingAddress.country,
    },
    paymentMethod: 'stripe' as const,
  }
  try {
    await sendOrderConfirmationEmail(payload, emailData)
  } catch (err: unknown) {
    payload.logger.error(`[stripe-webhook] Failed to send order confirmation email: ${err instanceof Error ? err.message : err}`)
  }
  try {
    await sendCrewOrderAlert(payload, emailData)
  } catch (err: unknown) {
    payload.logger.error(`[stripe-webhook] Failed to send crew alert email: ${err instanceof Error ? err.message : err}`)
  }
}
