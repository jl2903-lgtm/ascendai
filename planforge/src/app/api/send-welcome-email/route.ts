import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail, sendEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      console.error('[send-welcome-email] Missing fields:', { email, name })
      return NextResponse.json({ error: 'Missing email or name' }, { status: 400 })
    }

    // Fire GHL webhook (fire-and-forget)
    if (process.env.GHL_WEBHOOK_URL) {
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      fetch(process.env.GHL_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          name,
          email,
          source: 'Tyoutor Pro Signup',
          tags: ['tyoutor-pro-signup'],
        }),
      }).catch(() => {})
    }

    // User-facing welcome email
    await sendWelcomeEmail(email, name)

    // Internal admin notification
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'info@tyoutorpro.io'
    sendEmail({
      to: adminEmail,
      subject: `New signup: ${name}`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px;">
  <h2 style="color:#2D6A4F;margin:0 0 16px;">New user signed up</h2>
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;">
    <tr>
      <td style="padding:8px 0;font-weight:700;color:#444;width:80px;">Name</td>
      <td style="padding:8px 0;color:#222;">${name}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-weight:700;color:#444;">Email</td>
      <td style="padding:8px 0;color:#222;">${email}</td>
    </tr>
  </table>
</div>`,
    }).catch((err) => console.error('[send-welcome-email] Admin notification failed:', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[send-welcome-email] Unexpected error:', err)
    return NextResponse.json({ success: true }) // Non-critical, don't fail signup
  }
}

