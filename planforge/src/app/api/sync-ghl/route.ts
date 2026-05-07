import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SECRET = 'sync-existing-2026'

function splitName(fullName: string | null): { firstName: string; lastName: string } {
  const parts = (fullName || '').trim().split(' ')
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }
}

export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get('secret') !== SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ghlUrl = process.env.GHL_WEBHOOK_URL
    if (!ghlUrl) {
      return NextResponse.json({ error: 'GHL_WEBHOOK_URL not configured' }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL not configured' }, { status: 500 })
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 })

    const supabase = createAdminClient()

    // Pull names from auth.users metadata — this is where Google/email signup names are stored.
    // The public users.full_name column is often null or incorrect.
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (authError) {
      return NextResponse.json({ error: 'Failed to fetch auth users', detail: authError.message }, { status: 500 })
    }

    // Build a map of email → name from auth metadata
    const nameByEmail = new Map<string, string>()
    for (const authUser of authData.users) {
      if (!authUser.email) continue
      const meta = authUser.user_metadata ?? {}
      const name = meta.full_name || meta.name || ''
      if (name) nameByEmail.set(authUser.email.toLowerCase(), name)
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('email, full_name, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users', detail: error.message }, { status: 500 })
    }

    const total = users?.length ?? 0

    // Preview mode: return the first 5 payloads without sending to GHL
    if (req.nextUrl.searchParams.get('preview') === 'true') {
      const preview = (users ?? []).slice(0, 5).map(user => {
        const resolvedName = nameByEmail.get(user.email?.toLowerCase()) || user.full_name || ''
        const { firstName, lastName } = splitName(resolvedName)
        return {
          email: user.email,
          public_full_name: user.full_name,
          auth_metadata_name: nameByEmail.get(user.email?.toLowerCase()) ?? null,
          resolved_name: resolvedName,
          payload: { firstName, lastName, name: resolvedName, email: user.email },
        }
      })
      return NextResponse.json({ total, preview })
    }

    const failures: { email: string; error: string }[] = []

    const results = await Promise.allSettled(
      (users ?? []).map(user => {
        // Prefer auth metadata name, fall back to public users.full_name
        const resolvedName = nameByEmail.get(user.email?.toLowerCase()) || user.full_name || ''
        const { firstName, lastName } = splitName(resolvedName)
        return fetch(ghlUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            name: resolvedName,
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

    return NextResponse.json({ total, synced, failed: failures.length, failures })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Unexpected error', detail: msg }, { status: 500 })
  }
}
