import type { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { FALLBACK_POSTS } from '@/lib/blog-fallback'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base,              lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/blog`,    lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  try {
    const supabase = createSupabaseServerClient()
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })

    if (data && data.length > 0) {
      const postEntries: MetadataRoute.Sitemap = data.map(p => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: new Date(p.updated_at ?? p.published_at ?? now),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
      return [...staticEntries, ...postEntries]
    }
  } catch {}

  const fallbackPostEntries: MetadataRoute.Sitemap = FALLBACK_POSTS.map(p => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.published_at ?? now),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
  return [...staticEntries, ...fallbackPostEntries]
}
