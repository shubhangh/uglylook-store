import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request): Promise<Response> {
  try {
    const { email, source } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json({ error: 'Valid email required.' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const cleanEmail = email.toLowerCase().trim()

    // Check if already subscribed
    const existing = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: cleanEmail } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      // Re-activate if previously unsubscribed
      if (!existing.docs[0].active) {
        await payload.update({
          collection: 'subscribers',
          id: existing.docs[0].id,
          data: { active: true },
        })
        // Send welcome back email
        sendWelcomeEmail(payload, cleanEmail, true)
      }
      return Response.json({ success: true, message: 'Already subscribed.' })
    }

    await payload.create({
      collection: 'subscribers',
      data: {
        email: cleanEmail,
        source: source || 'footer',
      },
    })

    // Send welcome email (fire and forget)
    sendWelcomeEmail(payload, cleanEmail, false)

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

async function sendWelcomeEmail(
  payload: any,
  to: string,
  isResubscribe: boolean,
): Promise<void> {
  try {
    await payload.sendEmail({
      to,
      from: `${process.env.RESEND_CREW_NAME || 'UglyLook Crew'} <${process.env.RESEND_CREW_EMAIL || 'crew@uglylook.com'}>`,
      subject: isResubscribe ? 'Welcome back to the crew.' : 'You\'re in.',
      html: `
        <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 520px; margin: 0 auto; color: #111; padding: 32px 0;">
          <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em;">
            ${isResubscribe ? 'Welcome back.' : 'You\'re in.'}
          </h1>
          <p style="font-size: 14px; color: #555; margin: 0 0 24px; line-height: 1.6;">
            ${isResubscribe
              ? 'Missed us? We didn\'t notice. (We did.)'
              : 'No spam. Just drops. New pieces when they exist. Retired pieces when they don\'t.'}
          </p>

          <div style="background: #111; padding: 24px; border-radius: 4px; margin: 24px 0;">
            <p style="color: #D9D2C2; font-size: 13px; margin: 0 0 4px; letter-spacing: 0.06em; text-transform: uppercase;">
              What to expect
            </p>
            <p style="color: #999; font-size: 13px; margin: 0; line-height: 1.6;">
              Drop announcements. Restock alerts. Occasional nonsense. We email like adults.
            </p>
          </div>

          <a href="https://uglylook.com/shop" style="display: inline-block; padding: 10px 24px; background: #111; color: #f5f2ec; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;">
            Browse the Store
          </a>

          <p style="font-size: 11px; color: #aaa; margin-top: 40px; line-height: 1.5;">
            Ugly is the new sick.<br/>
            — UglyLook
          </p>
        </div>
      `,
    })
    payload.logger.info(`[Email] Welcome email sent to ${to}`)
  } catch (err: any) {
    payload.logger.error(`[Email] Failed to send welcome email to ${to}: ${err.message}`)
  }
}
