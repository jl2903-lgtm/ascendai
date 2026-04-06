import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ success: true }) // Silently skip if not configured

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://planforge.app'
    const firstName = name?.split(' ')[0] || 'there'

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PlanForge <hello@planforge.app>',
        to: email,
        subject: 'Welcome to PlanForge — your lesson planning just got easier',
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0F172A;color:#F8FAFC;padding:40px;border-radius:12px"><h1 style="color:#0D9488">PlanForge</h1><h2>Hey ${firstName}, welcome aboard! 👋</h2><p style="color:#94A3B8">You've just joined thousands of ESL/EFL teachers who plan smarter. Your free account gives you 5 lessons and 5 worksheets per month.</p><a href="${appUrl}/dashboard" style="display:inline-block;background:#0D9488;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:20px">Start Planning →</a></div>`,
      }),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true }) // Non-critical, don't fail signup
  }
}
