import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import type { ClassProfile } from '@/types'

export async function GET() {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('class_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('[class-profiles GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      class_name,
      student_nationality,
      student_age_group,
      class_size,
      cefr_level,
      course_type,
      textbook,
      weak_areas,
      focus_skills,
      additional_notes,
    } = body

    if (!class_name?.trim()) {
      return NextResponse.json({ error: 'class_name is required' }, { status: 400 })
    }

    const insert: Partial<ClassProfile> = {
      user_id: session.user.id,
      class_name: class_name.trim(),
      student_nationality: student_nationality ?? 'Chinese (Mandarin)',
      student_age_group: student_age_group ?? 'adults',
      class_size: class_size ?? 15,
      cefr_level: cefr_level ?? 'B1',
      course_type: course_type ?? 'General English',
      textbook: textbook ?? null,
      weak_areas: weak_areas ?? [],
      focus_skills: focus_skills ?? [],
      additional_notes: additional_notes ?? null,
    }

    const { data, error } = await supabase
      .from('class_profiles')
      .insert(insert)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[class-profiles POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
