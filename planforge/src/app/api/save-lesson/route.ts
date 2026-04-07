import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

import type { LessonContent } from '@/types'

interface SaveLessonBody {
  title: string
  studentLevel: string
  topic: string
  lessonLength: number
  studentAgeGroup: string
  studentNationality: string
  lessonContent: LessonContent
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

    // Only Pro users can save lessons
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
    } = body

    if (!title || !studentLevel || !topic || !lessonLength || !studentAgeGroup || !studentNationality || !lessonContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
