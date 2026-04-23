'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect, useRef } from 'react'
import type { BlogPost } from '@/types'

type PreviewPost = Pick<BlogPost,
  'id' | 'slug' | 'title' | 'excerpt' | 'cover_image_url' | 'category' | 'tags' | 'author_name' | 'read_time_minutes' | 'published_at'>

const CATEGORIES = ['All', 'Teaching Tips', 'Lesson Ideas', 'Career', 'Product Updates'] as const
type Category = typeof CATEGORIES[number]

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function BlogListing({ posts }: { posts: PreviewPost[] }) {
  const [category, setCategory] = useState<Category>('All')

  const filtered = useMemo(() => {
    if (category === 'All') return posts
    return posts.filter(p => p.category === category)
  }, [posts, category])

  return (
    <section className="px-6 py-14">
      <div className="max-w-6xl mx-auto">
        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {CATEGORIES.map(cat => {
            const active = category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className="rounded-full px-5 py-2 text-[13px] font-bold transition-all"
                style={
                  active
                    ? { background: '#2D6A4F', color: '#FFFFFF', border: '1px solid #2D6A4F', boxShadow: '0 2px 10px rgba(45,106,79,0.2)' }
                    : { background: '#F8F7F2', color: '#666666', border: '1px solid #E8E4DE' }
                }
              >
                {cat}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm font-medium" style={{ color: '#8C8880' }}>
              No posts in this category yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((post, i) => (
              <RevealCard key={post.id} post={post} delay={i * 80} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function RevealCard({ post, delay }: { post: PreviewPost; delay: number }) {
  const ref = useRef<HTMLAnchorElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            obs.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <Link
      ref={ref}
      href={`/blog/${post.slug}`}
      className="group block rounded-xl overflow-hidden card-lift"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8E4DE',
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        opacity: visible ? 1 : 0,
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms, box-shadow 0.2s ease`,
      }}
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
        <h2
          className="font-bold mb-2 leading-snug line-clamp-2"
          style={{ fontSize: 18, color: '#1A1A1A', letterSpacing: '-0.3px' }}
        >
          {post.title}
        </h2>
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
          <span className="text-[12px] font-medium" style={{ color: '#B8B4AC' }}>
            {formatDate(post.published_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}
