export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FALLBACK_POSTS } from '@/lib/blog-fallback'

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: 'Admin access not configured' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const posts = FALLBACK_POSTS.map(({ id: _id, ...p }) => p)

    const { data, error } = await supabase
      .from('blog_posts')
      .upsert(posts, { onConflict: 'slug', ignoreDuplicates: false })
      .select('slug')

    if (error) {
      console.error('[seed-blog] upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ seeded: data?.length ?? 0, slugs: data?.map(p => p.slug) })
  } catch (err) {
    console.error('[seed-blog] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
