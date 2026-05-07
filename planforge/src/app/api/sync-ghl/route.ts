import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SECRET = 'sync-existing-2026'
const DELAY_MS = 500

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function splitName(fullName: string | null): { firstName: string; lastName: string } {
  const parts = (fullName || '').trim().split(' ')
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ghlUrl = process.env.GHL_WEBHOOK_URL
  if (!ghlUrl) {
    return NextResponse.json({ error: 'GHL_WEBHOOK_URL not configured' }, { status: 500 })
  }

  const supabase = createAdminClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('email, full_name, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch users', detail: error.message }, { status: 500 })
  }

  const total = users?.length ?? 0
  let synced = 0
  const failures: { email: string; error: string }[] = []

  for (let i = 0; i < (users ?? []).length; i++) {
    const user = users![i]
    const { firstName, lastName } = splitName(user.full_name)

    try {
      const res = await fetch(ghlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          name: user.full_name || '',
          email: user.email,
          source: 'Tyoutor Pro - Existing User Sync',
          tags: ['tyoutor-pro-signup', 'existing-user'],
        }),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => res.statusText)
        throw new Error(`HTTP ${res.status}: ${body}`)
      }

      synced++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ email: user.email, error: msg })
    }

    if (i < (users ?? []).length - 1) {
      await sleep(DELAY_MS)
    }
  }

  return NextResponse.json({
    total,
    synced,
    failed: failures.length,
    failures,
  })
}
