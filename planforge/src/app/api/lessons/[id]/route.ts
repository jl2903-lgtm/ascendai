import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

// Polled by the Teach Mode generation screen every 2s. Returns the current
// activities_status (and the activities payload when ready) so the client can
// transition into the runner.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('id, user_id, activities_status, activities_error, activities')
    .eq('id', params.id)
    .single()

  if (error || !lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (lesson.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({
    id: lesson.id,
    activities_status: lesson.activities_status,
    activities_error: lesson.activities_error,
    // Don't ship the activities payload until it's ready — it's irrelevant
    // for polling and bigger than the rest of the response combined.
    activities: lesson.activities_status === 'ready' ? lesson.activities : null,
  })
}
