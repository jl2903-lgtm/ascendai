import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail, sendEmail } from '@/lib/resend'
import { escapeHtml } from '@/lib/html-escape'

export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret || request.headers.get('x-api-key') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email, name, skipGhl } = await request.json()

    if (!email || !name) {
      console.error('[send-welcome-email] Missing fields:', { email, name })
      return NextResponse.json({ error: 'Missing email or name' }, { status: 400 })
    }

    // Fire GHL webhook (fire-and-forget). Callers that already fired GHL
    // directly (e.g. Payment Link auto-create) should pass skipGhl: true
    // to avoid a duplicate contact.
    if (process.env.GHL_WEBHOOK_URL && !skipGhl) {
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0] || 'there'
      const lastName = nameParts.slice(1).join(' ') || ''

      fetch(process.env.GHL_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          full_name: name,
          email,
          source: 'Tyoutor Pro Signup',
          tags: ['tyoutor-pro-signup'],
        }),
      }).catch((err) => console.error('[GHL webhook] failed:', err))
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
      <td style="padding:8px 0;color:#222;">${escapeHtml(name)}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;font-weight:700;color:#444;">Email</td>
      <td style="padding:8px 0;color:#222;">${escapeHtml(email)}</td>
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

