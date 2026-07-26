import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate-limit per user so a caller can't loop this route to inflate the
    // download count on a resource they want to game the trending feed with.
    if (!checkRateLimit(`download:${session.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { id } = await req.json()
    if (!id || typeof id !== 'string') return NextResponse.json({ error: 'Resource ID required' }, { status: 400 })

    // Atomic increment via RPC — the previous read-then-write via admin client
    // both raced (two concurrent hits both wrote N+1) and did nothing to
    // rate-limit trending manipulation. Falls back to read-then-write only if
    // the RPC isn't present.
    const admin = createAdminClient()
    const { error: rpcErr } = await admin.rpc('increment_download_count', { resource_id: id })
    if (rpcErr) {
      const { data: resource } = await admin
        .from('shared_resources')
        .select('download_count')
        .eq('id', id)
        .single()
      await admin
        .from('shared_resources')
        .update({ download_count: (resource?.download_count ?? 0) + 1 })
        .eq('id', id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[shared-resources/download]', err)
    return NextResponse.json({ error: 'Failed to record download.' }, { status: 500 })
  }
}
