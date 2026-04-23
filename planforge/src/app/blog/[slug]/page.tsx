import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/landing/Navbar'
import type { BlogPost } from '@/types'

export const revalidate = 300

type Params = { slug: string }

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  return (data as BlogPost | null) ?? null
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Post not found — Tyoutor Pro' }
  return {
    title: `${post.title} — Tyoutor Pro Blog`,
    description: post.excerpt,
    keywords: [...post.tags, 'ESL', 'TEFL', 'teaching'].join(', '),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
      publishedTime: post.published_at ?? undefined,
      authors: [post.author_name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#FAFAF8', color: '#2D2D2D' }}>
      <Navbar />

      <article className="px-6 pt-14 pb-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[13px] font-semibold mb-8 transition-colors"
            style={{ color: '#6B6860' }}
          >
            <span aria-hidden>←</span>
            Back to blog
          </Link>

          <div
            className="inline-flex rounded-full px-3 py-1 text-[11px] font-bold tracking-wide mb-5"
            style={{ background: 'rgba(45,106,79,0.08)', color: '#2D6A4F' }}
          >
            {post.category}
          </div>

          <h1
            className="font-extrabold tracking-tight mb-5"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 2.75rem)', letterSpacing: '-1.2px', lineHeight: 1.12, color: '#1A1A1A' }}
          >
            {post.title}
          </h1>

          <p className="font-medium mb-8" style={{ fontSize: 17, color: '#6B6860', lineHeight: 1.6 }}>
            {post.excerpt}
          </p>

          <div className="flex items-center gap-3 pb-8 mb-10" style={{ borderBottom: '1px solid #E8E4DE' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
              style={{ background: 'linear-gradient(135deg,#2D6A4F,#40916C)', color: '#FFFFFF' }}
            >
              {post.author_name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-[13px]" style={{ color: '#2D2D2D' }}>
                {post.author_name}
              </div>
              <div className="text-[12px] font-medium" style={{ color: '#8C8880' }}>
                {formatDate(post.published_at)} · {post.read_time_minutes} min read
              </div>
            </div>
          </div>

          {post.cover_image_url && (
            <div
              className="w-full overflow-hidden rounded-2xl mb-10"
              style={{ aspectRatio: '16 / 9', border: '1px solid #E8E4DE' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8" style={{ borderTop: '1px solid #E8E4DE' }}>
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{ background: '#F8F7F2', color: '#6B6860', border: '1px solid #E8E4DE' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div
            className="mt-16 rounded-2xl p-8 text-center"
            style={{ background: 'linear-gradient(135deg,#EDF6F0,#DCEDE0)', border: '1px solid rgba(45,106,79,0.15)' }}
          >
            <h2 className="text-xl font-extrabold mb-2" style={{ color: '#1A1A1A', letterSpacing: '-0.3px' }}>
              Stop spending your weekends on lesson plans.
            </h2>
            <p className="font-medium mb-5" style={{ color: '#6B6860', fontSize: 15 }}>
              Tyoutor Pro generates tailored ESL lessons in 15 seconds — free to try, no card needed.
            </p>
            <Link
              href="/auth/signup"
              className="btn-primary inline-flex items-center justify-center px-6 py-3"
              style={{ fontSize: 14, fontWeight: 800 }}
            >
              Start Free Today →
            </Link>
          </div>
        </div>
      </article>

      <footer className="py-12 px-6 border-t" style={{ borderColor: '#E8E4DE' }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-medium" style={{ color: '#8C8880' }}>
            © {new Date().getFullYear()} Tyoutor Pro · Built exclusively for ESL &amp; TEFL teachers
          </p>
        </div>
      </footer>
    </div>
  )
}
