import { NextRequest, NextResponse } from 'next/server'

// GoHighLevel webhook that fires as soon as someone completes the signup form —
// before Stripe checkout, so we get a CRM entry even for people who never pay.
//
// This is a public webhook trigger endpoint on the LeadConnector side (not a
// secret). Kept in an env var so it can be rotated / redirected in Vercel
// without a redeploy; falls back to the current production URL when unset so
// the flow keeps working immediately after this ships.
const GHL_SIGNUP_WEBHOOK_URL =
  process.env.GHL_SIGNUP_WEBHOOK_URL ||
  'https://services.leadconnectorhq.com/hooks/rZvJNhJSRuT8WcnQSx9I/webhook-trigger/38cc589d-f52e-46a2-b3a2-29fd41553ec0'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const fullName = typeof name === 'string' ? name.trim() : ''
    const parts = fullName.split(/\s+/).filter(Boolean)
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ')

    // Fire-and-forget from the caller's perspective — but await here so the
    // Node runtime doesn't kill the request when the client redirects to
    // Stripe. Cap to 5s so a GHL blip can't block signup.
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5_000)
    try {
      const res = await fetch(GHL_SIGNUP_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          source: 'Tyoutor Pro Signup',
          tags: ['tyoutor-pro-signup'],
        }),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        console.error('[notify-signup] GHL webhook non-2xx:', res.status, await res.text().catch(() => ''))
      }
    } finally {
      clearTimeout(timer)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Never fail signup on CRM sync — log and swallow.
    console.error('[notify-signup] unexpected error:', err)
    return NextResponse.json({ ok: true })
  }
}
