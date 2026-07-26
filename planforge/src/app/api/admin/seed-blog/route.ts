export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkBearerAuth } from '@/lib/auth-utils'
import { FALLBACK_POSTS } from '@/lib/blog-fallback'

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Admin access not configured' }, { status: 500 })
  }

  if (!checkBearerAuth(req.headers.get('authorization'), process.env.ADMIN_PASSWORD)) {
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
      // Log full detail server-side; return a generic message so we don't
      // leak column names / hints to the client.
      console.error('[seed-blog] upsert error:', error)
      return NextResponse.json({ error: 'Failed to seed blog posts' }, { status: 500 })
    }

    return NextResponse.json({ seeded: data?.length ?? 0, slugs: data?.map(p => p.slug) })
  } catch (err) {
    console.error('[seed-blog] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
