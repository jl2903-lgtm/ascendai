import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { boundedString, boundedInt, boundedStringArray } from '@/lib/input-caps'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Cap/coerce every field. Previously e.g. `class_name: 123` would 500 on
    // `.trim()`. Uses the same helpers as the POST route to stay in sync.
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.class_name !== undefined) {
      const v = boundedString(body.class_name, 80).trim()
      if (!v) return NextResponse.json({ error: 'class_name cannot be empty' }, { status: 400 })
      update.class_name = v
    }
    if (body.student_nationality !== undefined) update.student_nationality = boundedString(body.student_nationality, 60)
    if (body.student_age_group !== undefined)   update.student_age_group   = boundedString(body.student_age_group, 40)
    if (body.class_size !== undefined)          update.class_size          = boundedInt(body.class_size, 1, 200, 15)
    if (body.cefr_level !== undefined)          update.cefr_level          = boundedString(body.cefr_level, 20)
    if (body.course_type !== undefined)         update.course_type         = boundedString(body.course_type, 60)
    if (body.textbook !== undefined)            update.textbook            = boundedString(body.textbook, 200) || null
    if (body.weak_areas !== undefined)          update.weak_areas          = boundedStringArray(body.weak_areas, 20, 60)
    if (body.focus_skills !== undefined)        update.focus_skills        = boundedStringArray(body.focus_skills, 20, 60)
    if (body.additional_notes !== undefined)    update.additional_notes    = boundedString(body.additional_notes, 500) || null

    const { data, error } = await supabase
      .from('class_profiles')
      .update(update)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select('*')
      .single()

    if (error) {
      console.error('[class-profiles PUT]', error)
      return NextResponse.json({ error: 'Failed to update class profile' }, { status: 500 })
    }
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

    if (error) {
      console.error('[class-profiles DELETE]', error)
      return NextResponse.json({ error: 'Failed to delete class profile' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[class-profiles DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
