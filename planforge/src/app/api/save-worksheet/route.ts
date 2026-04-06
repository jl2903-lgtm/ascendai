import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

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

    // Only Pro users can save worksheets
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.subscription_status !== 'pro') {
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
