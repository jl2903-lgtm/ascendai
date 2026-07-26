import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { boundedString, boundedInt, boundedStringArray } from '@/lib/input-caps'
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

    if (error) {
      console.error('[class-profiles GET]', error)
      return NextResponse.json({ error: 'Failed to load class profiles' }, { status: 500 })
    }
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

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Coerce + cap every field. Previously `class_name.trim()` would 500 if
    // the client sent `class_name: 123`, and unbounded arrays could inflate
    // the JSONB row indefinitely.
    const className = boundedString(body.class_name, 80).trim()
    if (!className) {
      return NextResponse.json({ error: 'class_name is required' }, { status: 400 })
    }

    const insert: Partial<ClassProfile> = {
      user_id: session.user.id,
      class_name: className,
      student_nationality: boundedString(body.student_nationality, 60) || 'Chinese (Mandarin)',
      student_age_group: boundedString(body.student_age_group, 40) || 'adults',
      class_size: boundedInt(body.class_size, 1, 200, 15),
      cefr_level: boundedString(body.cefr_level, 20) || 'B1',
      course_type: boundedString(body.course_type, 60) || 'General English',
      textbook: boundedString(body.textbook, 200) || null,
      weak_areas: boundedStringArray(body.weak_areas, 20, 60),
      focus_skills: boundedStringArray(body.focus_skills, 20, 60),
      additional_notes: boundedString(body.additional_notes, 500) || null,
    }

    const { data, error } = await supabase
      .from('class_profiles')
      .insert(insert)
      .select('*')
      .single()

    if (error) {
      console.error('[class-profiles POST]', error)
      return NextResponse.json({ error: 'Failed to save class profile' }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[class-profiles POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
