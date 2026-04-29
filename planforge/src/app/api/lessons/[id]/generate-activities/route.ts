import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateActivities } from '@/lib/activities/generate'
import type { LessonFormData, LessonContent } from '@/types'

// Stage 2: on-demand activity generation. The lesson view's "Teach this
// lesson" button hits this endpoint when activities aren't ready yet. We mark
// the row as `generating` so a refresh during the wait correctly resumes the
// polling screen, then run the structured-output call against the existing
// plan, then mark `ready` (or `failed` with a stored error message).
//
// IMPORTANT: this is a long-running synchronous endpoint (~60–90s on average).
// On Vercel Hobby (10s timeout) it WILL fail. Confirm Pro (60s) or higher in
// the project's Vercel settings — we flag this in the audit report.
export const maxDuration = 300 // 5 min cap; honored on Vercel Pro+ tiers.

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    if (!checkRateLimit(userId, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, user_id, title, student_level, topic, lesson_length, student_age_group, student_nationality, lesson_content, activities_status')
      .eq('id', params.id)
      .single()

    if (error || !lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (lesson.user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // De-dupe: if a generation is already in flight (or finished) just return
    // the current state so the polling screen lights up correctly.
    if (lesson.activities_status === 'generating') {
      return NextResponse.json({ status: 'generating' })
    }
    if (lesson.activities_status === 'ready') {
      return NextResponse.json({ status: 'ready' })
    }

    // Mark as generating up-front so a refresh during the wait sees the
    // generation screen instead of starting a duplicate run.
    const { error: lockError } = await supabase
      .from('lessons')
      .update({ activities_status: 'generating', activities_error: null })
      .eq('id', lesson.id)
      .eq('user_id', userId)

    if (lockError) {
      console.error('[generate-activities] failed to mark generating', lockError)
      return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 })
    }

    const formData: LessonFormData = {
      level: lesson.student_level,
      topic: lesson.topic,
      length: lesson.lesson_length,
      ageGroup: lesson.student_age_group,
      nationality: lesson.student_nationality,
      classSize: 'Standard class (7-20)',
      specialFocus: [],
    }

    try {
      const activities = await generateActivities(
        formData,
        null,
        lesson.lesson_content as LessonContent,
      )

      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          activities,
          activities_status: 'ready',
          activities_error: null,
        })
        .eq('id', lesson.id)
        .eq('user_id', userId)

      if (updateError) throw new Error(`save failed: ${updateError.message}`)

      return NextResponse.json({ status: 'ready', activities })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Activity generation failed'
      console.error('[generate-activities] failed', err)
      await supabase
        .from('lessons')
        .update({ activities_status: 'failed', activities_error: message.slice(0, 500) })
        .eq('id', lesson.id)
        .eq('user_id', userId)
      return NextResponse.json({ status: 'failed', error: message }, { status: 500 })
    }
  } catch (err) {
    console.error('[generate-activities]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
