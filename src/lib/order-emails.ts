import type { Payload } from 'payload'

/**
 * Order email notifications.
 *
 * - Order confirmation → customer (after payment)
 * - New order alert → crew/admin (internal)
 *
 * Uses Payload's built-in email transport (Resend adapter).
 * All functions are fire-and-forget — they log errors but don't throw.
 */

interface OrderEmailData {
  to: string
  orderId: string
  amount: number // in cents
  items: Array<{
    title: string
    variant?: string
    quantity: number
    price: number // in cents
  }>
  shipping: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  paymentMethod?: 'stripe' | 'simulated'
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function orderItemsHtml(items: OrderEmailData['items']): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; color: #333;">
          ${item.title}${item.variant ? `<br/><span style="color: #888; font-size: 12px;">${item.variant}</span>` : ''}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; color: #333; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; color: #333; text-align: right; font-variant-numeric: tabular-nums;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>`,
    )
    .join('')
}

/**
 * Send order confirmation email to customer.
 */
export async function sendOrderConfirmationEmail(
  payload: Payload,
  data: OrderEmailData,
): Promise<void> {
  const { to, orderId, amount, items, shipping } = data
  const orderRef = orderId.slice(-8).toUpperCase()

  try {
    await payload.sendEmail({
      to,
      subject: `Order confirmed — #${orderRef}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111; padding: 32px 0;">
          <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 4px; letter-spacing: -0.02em;">Got it.</h1>
          <p style="font-size: 13px; color: #888; margin: 0 0 24px;">Order #${orderRef}</p>

          <p style="font-size: 14px; color: #333; margin: 0 0 24px; line-height: 1.6;">
            Your order is confirmed. We'll get it printed, pressed, quality-checked, and shipped. You'll get a tracking email when it's on the way.
          </p>

          <!-- Items -->
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #111; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Item</th>
                <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #111; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Qty</th>
                <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #111; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${orderItemsHtml(items)}
            </tbody>
          </table>

          <!-- Total -->
          <div style="text-align: right; margin: 0 0 24px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #888;">Total</span>
            <span style="display: block; font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums;">${formatPrice(amount)}</span>
          </div>

          <!-- Shipping -->
          <div style="background: #f5f2ec; padding: 16px; border-radius: 4px; margin: 0 0 24px;">
            <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin: 0 0 8px;">Ships to</p>
            <p style="font-size: 13px; color: #333; margin: 0; line-height: 1.5;">
              ${shipping.firstName} ${shipping.lastName}<br/>
              ${shipping.address}<br/>
              ${shipping.city}, ${shipping.state} ${shipping.zip}<br/>
              ${shipping.country}
            </p>
          </div>

          <!-- What's next -->
          <div style="background: #111; padding: 20px; border-radius: 4px; margin: 0 0 24px;">
            <p style="color: #D9D2C2; font-size: 10px; margin: 0 0 12px; letter-spacing: 0.08em; text-transform: uppercase;">What happens next</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #5A6242; font-size: 12px; padding: 4px 12px 4px 0; vertical-align: top; font-weight: 600;">01</td>
                <td style="color: #999; font-size: 12px; padding: 4px 0; line-height: 1.5;">Sent to print. Production starts within 24h.</td>
              </tr>
              <tr>
                <td style="color: #5A6242; font-size: 12px; padding: 4px 12px 4px 0; vertical-align: top; font-weight: 600;">02</td>
                <td style="color: #999; font-size: 12px; padding: 4px 0; line-height: 1.5;">Printed, pressed, quality-checked. 2–5 business days.</td>
              </tr>
              <tr>
                <td style="color: #5A6242; font-size: 12px; padding: 4px 12px 4px 0; vertical-align: top; font-weight: 600;">03</td>
                <td style="color: #999; font-size: 12px; padding: 4px 0; line-height: 1.5;">Ships from nearest hub. Tracking by email.</td>
              </tr>
            </table>
          </div>

          <a href="https://uglylook.com/shop" style="display: inline-block; padding: 10px 24px; background: #111; color: #f5f2ec; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;">
            Keep Browsing
          </a>

          <p style="font-size: 11px; color: #aaa; margin-top: 40px; line-height: 1.5;">
            Ugly is the new sick.<br/>
            — UglyLook
          </p>
        </div>
      `,
    })
    payload.logger.info(`[Email] Order confirmation sent to ${to} for order #${orderRef}`)
  } catch (err: any) {
    payload.logger.error(`[Email] Failed to send order confirmation to ${to}: ${err.message}`)
  }
}

/**
 * Send new order alert to crew/admin.
 */
export async function sendCrewOrderAlert(
  payload: Payload,
  data: OrderEmailData,
): Promise<void> {
  const crewEmail = process.env.RESEND_CREW_EMAIL
  if (!crewEmail) return

  const orderRef = data.orderId.slice(-8).toUpperCase()
  const itemsSummary = data.items
    .map((i) => `${i.quantity}x ${i.title}${i.variant ? ` (${i.variant})` : ''}`)
    .join(', ')

  try {
    await payload.sendEmail({
      to: crewEmail,
      from: `UglyLook Orders <${process.env.RESEND_FROM_EMAIL || 'orders@uglylook.com'}>`,
      subject: `New order #${orderRef} — ${formatPrice(data.amount)}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111; padding: 24px 0;">
          <h2 style="font-size: 16px; margin: 0 0 16px;">New Order #${orderRef}</h2>

          <table style="font-size: 13px; color: #333; line-height: 1.6;">
            <tr><td style="padding: 2px 16px 2px 0; color: #888;">Customer</td><td>${data.to}</td></tr>
            <tr><td style="padding: 2px 16px 2px 0; color: #888;">Items</td><td>${itemsSummary}</td></tr>
            <tr><td style="padding: 2px 16px 2px 0; color: #888;">Total</td><td><strong>${formatPrice(data.amount)}</strong></td></tr>
            <tr><td style="padding: 2px 16px 2px 0; color: #888;">Payment</td><td>${data.paymentMethod === 'stripe' ? 'Stripe' : 'Simulated'}</td></tr>
            <tr><td style="padding: 2px 16px 2px 0; color: #888;">Ship to</td><td>${data.shipping.firstName} ${data.shipping.lastName}, ${data.shipping.city} ${data.shipping.state} ${data.shipping.zip}</td></tr>
          </table>

          <p style="margin-top: 16px;">
            <a href="${process.env.NEXT_PUBLIC_SERVER_URL || 'https://uglylook.com'}/adm/collections/orders/${data.orderId}" style="display: inline-block; padding: 8px 20px; background: #111; color: #f5f2ec; text-decoration: none; border-radius: 4px; font-size: 12px;">
              View in Admin
            </a>
          </p>
        </div>
      `,
    })
    payload.logger.info(`[Email] Crew order alert sent for #${orderRef}`)
  } catch (err: any) {
    payload.logger.error(`[Email] Failed to send crew alert for #${orderRef}: ${err.message}`)
  }
}
