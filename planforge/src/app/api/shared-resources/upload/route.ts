import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      title, description,
      file_url, file_name, file_type, file_size_bytes,
      cefr_level, age_group, subject, resource_type, tags,
    } = body

    if (!title?.trim())    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!file_url)         return NextResponse.json({ error: 'File is required' }, { status: 400 })
    if (!cefr_level)       return NextResponse.json({ error: 'CEFR level is required' }, { status: 400 })
    if (!age_group)        return NextResponse.json({ error: 'Age group is required' }, { status: 400 })
    if (!subject)          return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    if (!resource_type)    return NextResponse.json({ error: 'Resource type is required' }, { status: 400 })

    // Look up the uploader's display name from their profile
    const { data: userRow } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', session.user.id)
      .single()

    const uploaderName =
      userRow?.full_name ||
      session.user.email?.split('@')[0] ||
      'Anonymous'

    const { data: resource, error } = await supabase
      .from('shared_resources')
      .insert({
        user_id: session.user.id,
        uploader_name: uploaderName,
        title: title.trim().slice(0, 120),
        description: description?.trim().slice(0, 500) || null,
        file_url,
        file_name,
        file_type: file_type ?? null,
        file_size_bytes: file_size_bytes ?? null,
        cefr_level,
        age_group,
        subject,
        resource_type,
        tags: Array.isArray(tags) && tags.length > 0 ? tags : null,
        is_public: true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ resource })
  } catch (err) {
    console.error('[shared-resources/upload]', err)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
