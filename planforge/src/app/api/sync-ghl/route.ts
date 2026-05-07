import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SECRET = 'sync-existing-2026'

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
  const failures: { email: string; error: string }[] = []

  const results = await Promise.allSettled(
    (users ?? []).map(user => {
      const { firstName, lastName } = splitName(user.full_name)
      return fetch(ghlUrl, {
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
      }).then(async res => {
        if (!res.ok) {
          const body = await res.text().catch(() => res.statusText)
          throw new Error(`HTTP ${res.status}: ${body}`)
        }
        return user.email
      })
    })
  )

  let synced = 0
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      synced++
    } else {
      failures.push({ email: users![i].email, error: result.reason?.message ?? String(result.reason) })
    }
  })

  return NextResponse.json({
    total,
    synced,
    failed: failures.length,
    failures,
  })
}
