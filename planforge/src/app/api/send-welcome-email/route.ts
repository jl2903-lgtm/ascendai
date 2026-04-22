import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // Fire GHL webhook (fire-and-forget)
    const ghlWebhookUrl = process.env.GHL_WEBHOOK_URL
    if (ghlWebhookUrl) {
      fetch(ghlWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name ?? '', event: 'user_signup' }),
      }).catch(() => {})
    }

    await sendWelcomeEmail(email, name ?? '')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true }) // Non-critical, don't fail signup
  }
}
