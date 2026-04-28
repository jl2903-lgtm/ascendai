import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateActivities } from '@/lib/activities/generate'
import type { LessonFormData } from '@/types'

// Re-runs activity generation against an existing saved lesson, populating
// lessons.activities. Used for legacy rows where activities is null.
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    if (!checkRateLimit(userId, 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json()
    const lessonId = body?.lessonId as string | undefined
    if (!lessonId) return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 })

    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, user_id, title, student_level, topic, lesson_length, student_age_group, student_nationality')
      .eq('id', lessonId)
      .single()

    if (error || !lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    if (lesson.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData: LessonFormData = {
      level: lesson.student_level,
      topic: lesson.topic,
      length: lesson.lesson_length,
      ageGroup: lesson.student_age_group,
      nationality: lesson.student_nationality,
      classSize: 'Standard class (7-20)',
      specialFocus: [],
    }

    const activities = await generateActivities(formData, null)

    const { error: updateError } = await supabase
      .from('lessons')
      .update({ activities })
      .eq('id', lessonId)

    if (updateError) {
      console.error('[regenerate-activities] update failed', updateError)
      return NextResponse.json({ error: 'Failed to save activities' }, { status: 500 })
    }

    return NextResponse.json({ activities })
  } catch (err) {
    console.error('[regenerate-activities]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
