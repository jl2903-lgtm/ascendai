import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/landing/Navbar'
import { BlogListing } from './BlogListing'
import type { BlogPost } from '@/types'

export const metadata: Metadata = {
  title: 'Blog — Tyoutor Pro',
  description: 'Tips, guides, and resources for ESL & TEFL teachers. Practical teaching advice, lesson planning frameworks, and career guidance from classroom-tested educators.',
  keywords: 'ESL blog, TEFL blog, ESL teaching tips, TEFL career, lesson planning, ESL resources',
  openGraph: {
    title: 'Tyoutor Pro Blog — Tips for ESL & TEFL Teachers',
    description: 'Tips, guides, and resources for ESL & TEFL teachers.',
    type: 'website',
  },
}

export const revalidate = 300

export default async function BlogIndexPage() {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, category, tags, author_name, read_time_minutes, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })

  const posts = (data ?? []) as Array<Pick<BlogPost,
    'id' | 'slug' | 'title' | 'excerpt' | 'cover_image_url' | 'category' | 'tags' | 'author_name' | 'read_time_minutes' | 'published_at'>>

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#FAFAF8', color: '#2D2D2D' }}>
      <Navbar />

      {/* Hero */}
      <section className="relative isolate px-6 pt-20 pb-12 overflow-hidden" style={{ background: '#F8F7F2' }}>
        <div aria-hidden style={{ position:'absolute',width:500,height:400,top:-80,right:-120,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#FFE5D9,#FECDA6)',opacity:0.18,pointerEvents:'none',animation:'blobFloat 8s ease-in-out 0s infinite alternate' }} />
        <div aria-hidden style={{ position:'absolute',width:420,height:340,top:120,left:-100,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#DCEDE0,#A8D5B9)',opacity:0.18,pointerEvents:'none',animation:'blobFloat 8s ease-in-out 3s infinite alternate' }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold mb-6" style={{ background:'rgba(45,106,79,0.08)', border:'1px solid rgba(45,106,79,0.18)', color:'#2D6A4F' }}>
            <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" style={{ animation:'pulse-dot 2s ease-in-out infinite' }} />
            The Tyoutor Pro Blog
          </div>
          <h1
            className="font-extrabold tracking-tight mb-5"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 3rem)', letterSpacing: '-1.5px', lineHeight: 1.08, color: '#1A1A1A' }}
          >
            Tyoutor Pro Blog
          </h1>
          <p className="mx-auto max-w-xl font-medium" style={{ fontSize: 16, color: '#777', lineHeight: 1.65 }}>
            Tips, guides, and resources for ESL &amp; TEFL teachers.
          </p>
        </div>
      </section>

      <BlogListing posts={posts} />

      {/* Footer */}
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
