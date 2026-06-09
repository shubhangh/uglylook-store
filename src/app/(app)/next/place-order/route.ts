import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { sendOrderConfirmationEmail, sendCrewOrderAlert } from '@/lib/order-emails'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIP(req)
  const { allowed } = rateLimit(`place-order:${ip}`, 5, 60_000)
  if (!allowed) {
    return Response.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()

    // Authenticate — customer or guest
    let user: any = null
    try {
      const auth = await payload.auth({ headers: requestHeaders })
      user = auth.user
    } catch {
      // Guest checkout — no auth required
    }

    const body = await req.json()
    const { cartId, items: clientItems, shipping, email } = body

    const hasName = shipping?.firstName || shipping?.name
    if (!hasName || !shipping?.address || !shipping?.city || !shipping?.zip) {
      return Response.json({ error: 'Complete shipping address required.' }, { status: 400 })
    }

    const customerEmail = email || (user as any)?.email || ''
    if (!customerEmail) {
      return Response.json({ error: 'Email required.' }, { status: 400 })
    }

    // Resolve cart items — either from cart ID or from client-provided items
    let resolvedItems: { product: any; variant: any; quantity: number }[] = []
    let cartDocId: string | null = null

    if (cartId) {
      try {
        const cart = await payload.findByID({
          collection: 'carts',
          id: cartId,
          depth: 2,
        })

        if (cart && !cart.purchasedAt && cart.items?.length) {
          resolvedItems = cart.items.map((item: any) => ({
            product: typeof item.product === 'object' ? item.product : null,
            variant: typeof item.variant === 'object' ? item.variant : null,
            quantity: item.quantity || 1,
          }))
          cartDocId = cart.id
        }
      } catch {
        // Cart not found — fall through to client items
      }
    }

    // Fallback: use client-provided items (for guest carts or when cart ID isn't available)
    if (resolvedItems.length === 0 && clientItems?.length) {
      for (const item of clientItems) {
        const productId = typeof item.product === 'object' ? item.product.id : item.product
        if (!productId) continue

        try {
          const product = await payload.findByID({
            collection: 'products',
            id: productId,
            depth: 1,
          })

          let variant = null
          if (item.variant) {
            const variantId = typeof item.variant === 'object' ? item.variant.id : item.variant
            try {
              variant = await payload.findByID({
                collection: 'variants',
                id: variantId,
                depth: 1,
              })
            } catch { /* variant not found */ }
          }

          resolvedItems.push({ product, variant, quantity: item.quantity || 1 })
        } catch { /* product not found */ }
      }
    }

    if (resolvedItems.length === 0) {
      return Response.json({ error: 'No valid items found. Cart may be empty.' }, { status: 400 })
    }

    // Calculate total
    let totalAmount = 0
    const orderItems: { product: string; variant?: string; quantity: number }[] = []

    for (const { product, variant, quantity } of resolvedItems) {
      if (!product) continue
      const price = variant?.priceInUSD ?? product.priceInUSD ?? 0
      totalAmount += price * quantity

      orderItems.push({
        product: product.id,
        ...(variant ? { variant: variant.id } : {}),
        quantity,
      })
    }

    if (totalAmount === 0) {
      return Response.json({ error: 'Order total is zero.' }, { status: 400 })
    }

    // Determine fulfillment source from product types
    const fulfillmentTypes = new Set(
      resolvedItems.map(({ product }) => (product as any)?.fulfillmentType || 'pod'),
    )
    let fulfillmentSource: 'pod' | 'self' | 'mixed' = 'pod'
    if (fulfillmentTypes.size > 1) fulfillmentSource = 'mixed'
    else if (fulfillmentTypes.has('self')) fulfillmentSource = 'self'

    // Build shipping address — supports both old (name) and new (firstName/lastName) format
    let firstName = shipping.firstName || ''
    let lastName = shipping.lastName || ''
    if (!firstName && shipping.name) {
      const nameParts = shipping.name.trim().split(/\s+/)
      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    }

    const shippingAddress = {
      firstName,
      lastName,
      addressLine1: shipping.address || shipping.addressLine1 || '',
      city: shipping.city || '',
      state: shipping.state || '',
      postalCode: shipping.zip || shipping.postalCode || '',
      country: shipping.country || 'US',
      phone: shipping.phone || '',
    }

    const customerId = user?.id || null

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
        ...(cartDocId ? { cart: cartDocId } : {}),
        items: orderItems,
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
        fulfillmentSource,
      },
    })

    // Link transaction → order (bypass lock — this is the initial setup)
    await payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: { order: order.id },
      context: { bypassLock: true },
    })

    // Mark cart as purchased (if we have one)
    if (cartDocId) {
      await payload.update({
        collection: 'carts',
        id: cartDocId,
        data: { purchasedAt: new Date().toISOString() },
      })
    }

    // Send order emails (fire and forget)
    const emailData = {
      to: customerEmail,
      orderId: order.id,
      amount: totalAmount,
      items: resolvedItems.map(({ product, variant, quantity }) => ({
        title: product?.title || 'Product',
        variant: variant?.title?.replace(`${product?.title} — `, '') || '',
        quantity,
        price: variant?.priceInUSD ?? product?.priceInUSD ?? 0,
      })),
      shipping: {
        firstName,
        lastName,
        address: shippingAddress.addressLine1,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
      paymentMethod: 'simulated' as const,
    }
    sendOrderConfirmationEmail(payload, emailData)
    sendCrewOrderAlert(payload, emailData)

    return Response.json({
      success: true,
      orderId: order.id,
      accessToken: (order as any).accessToken || null,
      amount: totalAmount,
    })
  } catch (error: any) {
    console.error('Place order error:', error)
    return Response.json(
      { error: error?.message || 'Failed to place order.' },
      { status: 500 },
    )
  }
}
