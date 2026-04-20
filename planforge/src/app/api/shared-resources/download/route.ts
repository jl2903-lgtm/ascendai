import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    // Auth required — unauthenticated users can't trigger downloads
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Resource ID required' }, { status: 400 })

    // Use admin client to bypass the RLS UPDATE policy (which only allows the uploader).
    // A minor race condition is acceptable for a download counter.
    const admin = createAdminClient()
    const { data: resource } = await admin
      .from('shared_resources')
      .select('download_count')
      .eq('id', id)
      .single()

    await admin
      .from('shared_resources')
      .update({ download_count: (resource?.download_count ?? 0) + 1 })
      .eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[shared-resources/download]', err)
    return NextResponse.json({ error: 'Failed to record download.' }, { status: 500 })
  }
}
