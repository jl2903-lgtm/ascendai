import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { data, error } = await supabase
      .from('class_profiles')
      .update({
        ...(class_name !== undefined && { class_name: class_name.trim() }),
        ...(student_nationality !== undefined && { student_nationality }),
        ...(student_age_group !== undefined && { student_age_group }),
        ...(class_size !== undefined && { class_size }),
        ...(cefr_level !== undefined && { cefr_level }),
        ...(course_type !== undefined && { course_type }),
        ...(textbook !== undefined && { textbook }),
        ...(weak_areas !== undefined && { weak_areas }),
        ...(focus_skills !== undefined && { focus_skills }),
        ...(additional_notes !== undefined && { additional_notes }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('[class-profiles PUT]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('class_profiles')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[class-profiles DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
