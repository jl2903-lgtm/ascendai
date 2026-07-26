import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ensureProfile } from '@/lib/supabase/ensure-profile'
import { isLegacyUser } from '@/lib/constants'

import type { WorksheetContent } from '@/types'

interface SaveWorksheetBody {
  title: string
  content: WorksheetContent
  lessonId?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Access policy mirrors /api/generate-worksheet — if a user was allowed to
    // generate the worksheet they must be allowed to save it, otherwise the
    // generate call silently discards their allowed output.
    const { profile, error: profileErr } = await ensureProfile<{
      subscription_status: string
      created_at: string | null
    }>(supabase, session, 'subscription_status, created_at')

    if (profileErr || !profile) {
      return NextResponse.json({ error: profileErr ?? 'Profile not found' }, { status: 500 })
    }

    const isPaid = profile.subscription_status === 'pro' || profile.subscription_status === 'trialing'
    if (!isPaid && !isLegacyUser(profile.created_at)) {
      return NextResponse.json(
        { error: 'Pro subscription required to save worksheets' },
        { status: 403 }
      )
    }

    const body: SaveWorksheetBody = await req.json()
    const { title, content, lessonId } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: savedWorksheet, error: insertError } = await supabase
      .from('worksheets')
      .insert({
        user_id: userId,
        title,
        content,
        lesson_id: lessonId ?? null,
      })
      .select('id')
      .single()

    if (insertError || !savedWorksheet) {
      console.error('[save-worksheet] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save worksheet' }, { status: 500 })
    }

    return NextResponse.json({ id: savedWorksheet.id }, { status: 201 })
  } catch (error) {
    console.error('[save-worksheet] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
