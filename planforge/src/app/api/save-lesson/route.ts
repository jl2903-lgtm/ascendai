import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ensureProfile } from '@/lib/supabase/ensure-profile'
import { isLegacyUser } from '@/lib/constants'

import type { LessonContent } from '@/types'
import { ActivitiesSchema } from '@/lib/activities/schema'

interface SaveLessonBody {
  title: string
  studentLevel: string
  topic: string
  lessonLength: number
  studentAgeGroup: string
  studentNationality: string
  lessonContent: LessonContent
  activities?: unknown
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

    // Access policy mirrors /api/generate-lesson — legacy free users get
    // allowed generations, so they must be allowed to save them too.
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
        { error: 'Pro subscription required to save lessons' },
        { status: 403 }
      )
    }

    const body: SaveLessonBody = await req.json()
    const {
      title,
      studentLevel,
      topic,
      lessonLength,
      studentAgeGroup,
      studentNationality,
      lessonContent,
      activities,
    } = body

    if (!title || !studentLevel || !topic || !lessonLength || !studentAgeGroup || !studentNationality || !lessonContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate activities if provided. Reject the save if they don't parse so
    // we never persist garbage into the JSONB column. Saves without activities
    // (legacy / failed activity generation) are allowed.
    let parsedActivities: unknown = null
    if (activities != null) {
      const result = ActivitiesSchema.safeParse(activities)
      if (!result.success) {
        return NextResponse.json({ error: 'Invalid activities payload' }, { status: 400 })
      }
      parsedActivities = result.data
    }

    const { data: savedLesson, error: insertError } = await supabase
      .from('lessons')
      .insert({
        user_id: userId,
        title,
        student_level: studentLevel,
        topic,
        lesson_length: lessonLength,
        student_age_group: studentAgeGroup,
        student_nationality: studentNationality,
        lesson_content: lessonContent,
        activities: parsedActivities,
      })
      .select('id')
      .single()

    if (insertError || !savedLesson) {
      console.error('[save-lesson] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save lesson' }, { status: 500 })
    }

    return NextResponse.json({ id: savedLesson.id }, { status: 201 })
  } catch (error) {
    console.error('[save-lesson] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
