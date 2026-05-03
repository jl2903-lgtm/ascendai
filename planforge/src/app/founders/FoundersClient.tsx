'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import {
  Sparkles, Camera, QrCode, Library, Brain, BookOpen,
  ArrowRight, Check, Lock, Mail, Star,
} from 'lucide-react'

// One-page campaign landing for tyoutorpro.io/founders. Email-traffic
// targeted: short, mobile-first, fast LCP. Brand colors borrowed from the
// rest of the app — teal-green primary (#2D6A4F), terra-cotta accent
// (#E07A5F), warm cream background (#FAF7F2). Nunito is loaded globally
// in the root layout, so we just rely on the inherited font stack.
//
// Animations: a single IntersectionObserver toggles a `.is-in` class on
// any element with `data-fade`. No animation libraries — keeps the bundle
// small and the email-clicked first paint fast.

export function FoundersClient() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = root.querySelectorAll<HTMLElement>('[data-fade]')
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
    )
    targets.forEach(t => io.observe(t))
    return () => io.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="founders-root min-h-screen text-slate-800">
      <NavBar />
      <Hero />
      <Features />
      <FoundingOffer />
      <SocialProof />
      <Footer />

      {/* Scoped styles for fade-in + smooth scroll. Kept inline so the
         page is fully self-contained and doesn't depend on any global
         CSS additions in the existing app. */}
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .founders-root {
          background:
            radial-gradient(ellipse 800px 600px at 80% -10%, rgba(82, 183, 136, 0.18), transparent 60%),
            radial-gradient(ellipse 700px 500px at 0% 30%, rgba(224, 122, 95, 0.15), transparent 60%),
            #FAF7F2;
        }
        [data-fade] {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 600ms ease-out, transform 600ms ease-out;
        }
        [data-fade].is-in {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          [data-fade] { opacity: 1; transform: none; transition: none; }
          html { scroll-behavior: auto; }
        }
      `}</style>
    </div>
  )
}

// ── Top bar — minimal: logo + single primary CTA ──────────────────────────────
function NavBar() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-[#FAF7F2]/80 border-b border-[#EAE3D7]">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-8 h-8 rounded-lg bg-[#2D6A4F] text-white font-extrabold flex items-center justify-center group-hover:scale-105 transition-transform">T</span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Tyoutor<span className="text-[#E07A5F]"> Pro</span>
          </span>
        </Link>
        <a
          href="#founding-offer"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D6A4F] hover:text-[#1F4D38]"
        >
          Founding offer <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </header>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative">
      <div className="max-w-5xl mx-auto px-5 pt-14 pb-16 sm:pt-20 sm:pb-24 text-center">
        <div data-fade className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-[#EAE3D7] px-3 py-1 text-xs font-semibold text-[#6B6860] shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
          For ESL & EFL teachers
        </div>
        <h1 data-fade className="mt-5 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-slate-900">
          Your AI Teaching Assistant
          <span className="block text-[#2D6A4F]">Has Arrived</span>
        </h1>
        <p data-fade className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Tyoutor Pro gives ESL teachers superpowers — plan lessons, correct student work, and share interactive practice materials in minutes, not hours.
        </p>
        <div data-fade className="mt-8 flex flex-col items-center gap-3">
          <a
            href="#founding-offer"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#2D6A4F] hover:bg-[#1F4D38] text-white text-base font-bold px-7 py-4 shadow-lg shadow-[#2D6A4F]/20 transition-colors"
          >
            Become a Founding Member — $8/month for Life
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-xs text-slate-500">
            <Lock className="inline w-3 h-3 mr-1 -mt-0.5" />
            Lock in the founding member price before it goes to $12/month
          </p>
        </div>

        {/* Hero "screenshot" placeholder card — kept lightweight (no img) so
           initial paint stays fast. Replace src when you have a real shot. */}
        <div data-fade className="mt-14 sm:mt-20 mx-auto max-w-3xl">
          <div className="aspect-[16/9] rounded-3xl bg-white border border-[#EAE3D7] shadow-2xl shadow-[#2D6A4F]/10 overflow-hidden flex items-center justify-center text-[#A89C82]">
            <div className="text-center px-6">
              <BookOpen className="w-10 h-10 mx-auto text-[#2D6A4F]/40" />
              <p className="text-sm mt-3 font-medium">Your lesson, ready in 60 seconds.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Lesson Planner',
    body: 'Generate full, structured lesson plans tailored to your students’ level, topic, and duration in seconds. No more blank-page syndrome.',
    tone: 'green',
  },
  {
    icon: BookOpen,
    title: 'Magic Paste',
    body: 'Paste any text — article, blog post, song lyrics — and Tyoutor Pro builds a complete lesson around it: comprehension questions, vocabulary, discussion prompts.',
    tone: 'terra',
  },
  {
    icon: Camera,
    title: 'Photo Error Correction',
    body: 'Snap a photo of student writing and get instant AI-powered error analysis with corrections, explanations, and feedback you can share.',
    tone: 'green',
  },
  {
    icon: QrCode,
    title: 'QR Code Student Practice',
    body: 'Generate a QR code for any lesson. Students scan it to access interactive practice on their own device — perfect for in-class or homework.',
    tone: 'terra',
  },
  {
    icon: Library,
    title: 'Shared Resources Library',
    body: 'Browse lessons uploaded by other teachers. Upload your own. A growing library of crowd-sourced, teacher-vetted materials.',
    tone: 'green',
  },
  {
    icon: Brain,
    title: 'Student & Class Memory',
    body: 'Tyoutor Pro remembers your students and classes — their levels, preferences, progress — so every lesson it generates is contextually relevant.',
    tone: 'terra',
  },
] as const

function Features() {
  return (
    <section id="features" className="relative py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-5">
        <div data-fade className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Everything you need to teach better, faster.
          </h2>
          <p className="mt-3 text-slate-600">
            Six tools, one suite. Built around the actual workflow of an ESL teacher — not a generic AI wrapper.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon: Icon, title, body, tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
  tone: 'green' | 'terra'
}) {
  const iconBg = tone === 'green' ? 'bg-[#E8F5EE] text-[#2D6A4F]' : 'bg-[#FFE9DF] text-[#C56342]'
  return (
    <article
      data-fade
      className="rounded-2xl bg-white border border-[#EAE3D7] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body.replace(/—/g, '—').replace(/’/g, '’')}</p>
    </article>
  )
}

// ── Founding Member Offer ─────────────────────────────────────────────────────
function FoundingOffer() {
  return (
    <section id="founding-offer" className="relative py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-5">
        <div data-fade className="text-center">
          <span className="inline-block rounded-full bg-[#FFE9DF] text-[#C56342] text-xs font-bold uppercase tracking-wider px-3 py-1">
            Limited launch offer
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Become a Founding Member
          </h2>
          <p className="mt-3 text-slate-600">
            Lock in lifetime pricing while we&rsquo;re still in launch mode. We&rsquo;re only opening this offer to the first 200 teachers.
          </p>
        </div>

        <div data-fade className="mt-10 rounded-3xl bg-white border-2 border-[#2D6A4F] p-7 sm:p-10 shadow-xl shadow-[#2D6A4F]/10 relative overflow-hidden">
          {/* Decorative corner accent */}
          <div aria-hidden className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#52B788]/15 blur-2xl" />
          <div aria-hidden className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-[#E07A5F]/15 blur-2xl" />

          <div className="relative">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-5xl sm:text-6xl font-extrabold text-slate-900">$8</span>
              <span className="text-slate-500 font-medium">/ month</span>
              <span className="text-slate-400 line-through text-lg">$12 / month</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#2D6A4F]">Locked in for life — your price never goes up.</p>

            <ul className="mt-7 space-y-3">
              {[
                'Full access to every feature, including everything we ship next',
                'Lock in this price forever — even when public pricing rises',
                'Cancel anytime, no contract',
                'Shape the product — your feedback drives what we build next',
              ].map(t => (
                <li key={t} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="text-sm leading-relaxed">{t.replace(/—/g, '—')}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/auth/signup?plan=founding"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2D6A4F] hover:bg-[#1F4D38] text-white font-bold text-base px-6 py-4 shadow-lg shadow-[#2D6A4F]/25 transition-colors"
            >
              Claim my founding spot
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="mt-4 text-center text-xs text-slate-500">
              <Lock className="inline w-3 h-3 mr-1 -mt-0.5" />
              Limited to the first 200 founding members
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Social proof / Trust ──────────────────────────────────────────────────────
function SocialProof() {
  return (
    <section className="relative py-16 sm:py-24 border-t border-[#EAE3D7]">
      <div className="max-w-5xl mx-auto px-5">
        <div data-fade className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-block rounded-full bg-[#E8F5EE] text-[#2D6A4F] text-xs font-bold uppercase tracking-wider px-3 py-1">
              Built by a teacher, for teachers
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Made for the realities of the ESL classroom.
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Founded by an ESL teacher with 4+ years in the classroom. Every feature is shaped by the actual problems we face every week — endless prep, repetitive correction, students drifting between sessions.
            </p>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Trusted by members of the <strong className="text-[#2D6A4F]">TEFL Freedom community</strong> — 75,000+ ESL teachers worldwide.
            </p>
          </div>

          <div className="rounded-3xl bg-white border border-[#EAE3D7] p-6 shadow-sm">
            <div className="flex items-center gap-1 text-[#E07A5F]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#E07A5F]" />
              ))}
            </div>
            <p className="mt-3 text-slate-700 italic leading-relaxed">
              &ldquo;Testimonial coming soon — we&rsquo;re collecting them from our first cohort of teachers right now.&rdquo;
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-500">— A founding member</p>
          </div>
        </div>

        <div data-fade className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl bg-white border border-[#EAE3D7] p-5 shadow-sm">
              <div className="flex items-center gap-1 text-[#E07A5F]">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-[#E07A5F]" />
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-600 italic leading-relaxed">
                &ldquo;Placeholder testimonial #{i} — fill in once we have real quotes from beta users.&rdquo;
              </p>
              <p className="mt-3 text-xs font-semibold text-slate-500">— Beta tester</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-[#EAE3D7] bg-white/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-[#2D6A4F] text-white text-xs font-extrabold flex items-center justify-center">T</span>
          <span className="font-bold text-slate-900">Tyoutor<span className="text-[#E07A5F]"> Pro</span></span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="https://tyoutorpro.io" className="hover:text-[#2D6A4F]">tyoutorpro.io</a>
          <a href="mailto:info@tyoutor.io" className="inline-flex items-center gap-1.5 hover:text-[#2D6A4F]">
            <Mail className="w-4 h-4" /> info@tyoutor.io
          </a>
        </div>
        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} Tyoutor Pro. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
