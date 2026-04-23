import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/landing/Navbar'
import type { BlogPost } from '@/types'

export const revalidate = 300

type Params = { slug: string }
type RelatedPost = Pick<BlogPost,
  'id' | 'slug' | 'title' | 'excerpt' | 'cover_image_url' | 'category' | 'author_name' | 'read_time_minutes' | 'published_at'>

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

async function getRelatedPosts(category: string, excludeId: string): Promise<RelatedPost[]> {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, category, author_name, read_time_minutes, published_at')
    .eq('published', true)
    .eq('category', category)
    .neq('id', excludeId)
    .order('published_at', { ascending: false })
    .limit(3)
  return (data ?? []) as RelatedPost[]
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Post not found — Tyoutor Pro' }

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/blog/${post.slug}`
  const images = post.cover_image_url ? [{ url: post.cover_image_url }] : undefined

  return {
    title: `${post.title} — Tyoutor Pro Blog`,
    description: post.excerpt,
    keywords: [...post.tags, 'ESL', 'TEFL', 'teaching'].join(', '),
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url,
      images,
      publishedTime: post.published_at ?? undefined,
      authors: [post.author_name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  }
}

function formatDate(iso: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', opts)
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post.category, post.id)

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tyoutor Pro',
      url: siteUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
    articleSection: post.category,
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#FAFAF8', color: '#2D2D2D' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <Navbar />

      <article className="pt-12 pb-20">
        {/* Header */}
        <header className="px-6">
          <div className="max-w-[720px] mx-auto text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[13px] font-semibold mb-10 transition-colors hover:text-[#2D2D2D]"
              style={{ color: '#6B6860' }}
            >
              <span aria-hidden>←</span>
              Back to blog
            </Link>

            {/* Top meta row: category · date · read time */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
                style={{ background: 'rgba(45,106,79,0.08)', color: '#2D6A4F' }}
              >
                {post.category}
              </span>
              <span aria-hidden style={{ color: '#C8C4BC' }}>·</span>
              <time
                dateTime={post.published_at ?? undefined}
                className="text-[13px] font-medium"
                style={{ color: '#8C8880' }}
              >
                {formatDate(post.published_at)}
              </time>
              <span aria-hidden style={{ color: '#C8C4BC' }}>·</span>
              <span className="text-[13px] font-medium" style={{ color: '#8C8880' }}>
                {post.read_time_minutes} min read
              </span>
            </div>

            <h1
              className="font-extrabold tracking-tight mb-8"
              style={{
                fontSize: 'clamp(2rem, 5vw, 40px)',
                letterSpacing: '-1.2px',
                lineHeight: 1.15,
                color: '#1A1A1A',
              }}
            >
              {post.title}
            </h1>

            {/* Author row */}
            <div className="inline-flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
                style={{ background: 'linear-gradient(135deg,#2D6A4F,#40916C)', color: '#FFFFFF' }}
                aria-hidden
              >
                {post.author_name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-bold text-[14px]" style={{ color: '#2D2D2D' }}>
                  By {post.author_name}
                </div>
                <div className="text-[12px] font-medium" style={{ color: '#8C8880' }}>
                  {formatDate(post.published_at)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Cover image */}
        {post.cover_image_url && (
          <div className="px-6 mt-12">
            <div
              className="max-w-[800px] mx-auto overflow-hidden"
              style={{
                aspectRatio: '16 / 9',
                borderRadius: 12,
                boxShadow: '0 12px 48px rgba(0,0,0,0.08)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <section className="px-6 mt-14">
          <div
            className="blog-content max-w-[680px] mx-auto"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags.length > 0 && (
            <div className="max-w-[680px] mx-auto flex flex-wrap gap-2 mt-12 pt-8" style={{ borderTop: '1px solid #E8E4DE' }}>
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
        </section>

        {/* CTA Banner */}
        <section className="px-6 mt-16">
          <div
            className="max-w-[800px] mx-auto text-center px-8 py-12 sm:px-12 sm:py-14 relative overflow-hidden"
            style={{
              background: '#2D6A4F',
              borderRadius: 16,
              boxShadow: '0 12px 40px rgba(45,106,79,0.25)',
            }}
          >
            <div aria-hidden style={{ position:'absolute',width:320,height:320,top:-140,right:-80,borderRadius:'50%',filter:'blur(70px)',background:'radial-gradient(ellipse,#52B788,transparent 70%)',opacity:0.35,pointerEvents:'none' }} />
            <div aria-hidden style={{ position:'absolute',width:260,height:260,bottom:-120,left:-60,borderRadius:'50%',filter:'blur(70px)',background:'radial-gradient(ellipse,#40916C,transparent 70%)',opacity:0.3,pointerEvents:'none' }} />

            <div className="relative">
              <h2
                className="font-extrabold mb-3"
                style={{ fontSize: 24, color: '#FFFFFF', letterSpacing: '-0.5px', lineHeight: 1.2 }}
              >
                Ready to save 18 hours a month?
              </h2>
              <p
                className="mb-7 mx-auto max-w-md font-medium"
                style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}
              >
                Try Tyoutor Pro free — 5 lessons, no credit card.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full font-extrabold transition-transform"
                style={{
                  background: '#FFFFFF',
                  color: '#2D6A4F',
                  fontSize: 14,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                }}
              >
                Start Free →
              </Link>
            </div>
          </div>
        </section>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="px-6 mt-20">
            <div className="max-w-6xl mx-auto">
              <h2
                className="font-extrabold mb-8"
                style={{ fontSize: 24, letterSpacing: '-0.5px', color: '#1A1A1A' }}
              >
                More from the blog
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {related.map(p => (
                  <RelatedCard key={p.id} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
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

function RelatedCard({ post }: { post: RelatedPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl overflow-hidden card-lift"
      style={{ background: '#FFFFFF', border: '1px solid #E8E4DE' }}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16 / 9', background: '#F4F2EE' }}>
        {post.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image_url}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#EDF6F0,#DCEDE0)' }} />
        )}
        <span
          className="absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
          style={{ background: 'rgba(255,255,255,0.95)', color: '#2D6A4F', backdropFilter: 'blur(6px)' }}
        >
          {post.category}
        </span>
      </div>
      <div className="p-5">
        <h3
          className="font-bold mb-2 leading-snug line-clamp-2"
          style={{ fontSize: 18, color: '#1A1A1A', letterSpacing: '-0.3px' }}
        >
          {post.title}
        </h3>
        <p
          className="font-medium leading-relaxed line-clamp-2 mb-4"
          style={{ fontSize: 14, color: '#666666' }}
        >
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #F0EEE9' }}>
          <span className="text-[12px] font-semibold" style={{ color: '#8C8880' }}>
            {post.author_name} · {post.read_time_minutes} min read
          </span>
          <time
            dateTime={post.published_at ?? undefined}
            className="text-[12px] font-medium"
            style={{ color: '#B8B4AC' }}
          >
            {formatDate(post.published_at, { day: 'numeric', month: 'short', year: 'numeric' })}
          </time>
        </div>
      </div>
    </Link>
  )
}
