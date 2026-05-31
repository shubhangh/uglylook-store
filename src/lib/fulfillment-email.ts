import type { Payload } from 'payload'

/**
 * Send fulfillment email notifications to customers.
 *
 * Uses Payload's built-in email transport (configured via payload.config email).
 * Falls back to logging if email is not configured.
 */

interface ShippedEmailData {
  to: string
  orderId: string
  trackingNumber?: string
  trackingCarrier?: string
  trackingUrl?: string
}

interface DeliveredEmailData {
  to: string
  orderId: string
}

export async function sendShippedEmail(
  payload: Payload,
  data: ShippedEmailData,
): Promise<void> {
  const { to, orderId, trackingNumber, trackingCarrier, trackingUrl } = data

  const trackingLine = trackingUrl
    ? `Track your order: ${trackingUrl}`
    : trackingNumber
      ? `Tracking: ${trackingNumber} (${trackingCarrier || 'carrier'})`
      : ''

  try {
    await payload.sendEmail({
      to,
      subject: `Your UglyLook order has shipped — #${orderId.slice(-8)}`,
      html: `
        <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <h2 style="font-size: 18px; margin-bottom: 4px;">Your order is on the way.</h2>
          <p style="color: #666; font-size: 13px; margin-top: 0;">Order #${orderId.slice(-8)}</p>

          ${trackingLine ? `
            <div style="background: #f5f2ec; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #555;">
                ${trackingCarrier ? `<strong>${trackingCarrier}</strong> — ` : ''}
                ${trackingNumber || ''}
              </p>
              ${trackingUrl ? `
                <a href="${trackingUrl}" style="display: inline-block; margin-top: 8px; padding: 8px 20px; background: #111; color: #f5f2ec; text-decoration: none; border-radius: 4px; font-size: 12px; letter-spacing: 0.04em;">
                  TRACK ORDER
                </a>
              ` : ''}
            </div>
          ` : ''}

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            Ugly is the new sick.<br/>
            — UglyLook
          </p>
        </div>
      `,
    })
    payload.logger.info(`[Email] Shipped notification sent to ${to} for order ${orderId}`)
  } catch (err: any) {
    payload.logger.error(`[Email] Failed to send shipped email to ${to}: ${err.message}`)
  }
}

export async function sendDeliveredEmail(
  payload: Payload,
  data: DeliveredEmailData,
): Promise<void> {
  const { to, orderId } = data

  try {
    await payload.sendEmail({
      to,
      subject: `Your UglyLook order has been delivered — #${orderId.slice(-8)}`,
      html: `
        <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
          <h2 style="font-size: 18px; margin-bottom: 4px;">Delivered.</h2>
          <p style="color: #666; font-size: 13px; margin-top: 0;">Order #${orderId.slice(-8)}</p>

          <p style="font-size: 13px; color: #333; margin: 20px 0;">
            Your order has arrived. If anything looks off, hit us up within 14 days.
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            Ugly is the new sick.<br/>
            — UglyLook
          </p>
        </div>
      `,
    })
    payload.logger.info(`[Email] Delivered notification sent to ${to} for order ${orderId}`)
  } catch (err: any) {
    payload.logger.error(`[Email] Failed to send delivered email to ${to}: ${err.message}`)
  }
}
