import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // Fire GHL webhook (fire-and-forget)
    if (process.env.GHL_WEBHOOK_URL) {
      const userName = name ?? ''
      const userEmail = email
      const nameParts = (userName || '').trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      fetch(process.env.GHL_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          name: userName || '',
          email: userEmail,
          source: 'Tyoutor Pro Signup',
          tags: ['tyoutor-pro-signup'],
        }),
      }).catch(() => {})
    }

    await sendWelcomeEmail(email, name ?? '')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true }) // Non-critical, don't fail signup
  }
}
