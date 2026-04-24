import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, FileText, MessageSquare, GraduationCap, Zap, CheckCircle, Clock, Download, Star, Users, Presentation } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Logo } from '@/components/ui/Logo'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'

export const metadata: Metadata = {
  title: 'Tyoutor Pro — AI Lesson Planning for ESL & TEFL Teachers',
  description: 'Generate complete, L1-aware lesson plans in 60 seconds. Built exclusively for ESL and TEFL teachers. Worksheets, error coaching, demo lessons, class profiles. Free to start.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Tyoutor Pro — AI Lesson Planning for ESL & TEFL Teachers',
    description: 'Generate complete, L1-aware lesson plans in 60 seconds. Built exclusively for ESL and TEFL teachers.',
    type: 'website',
    url: SITE_URL,
    siteName: 'Tyoutor Pro',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Tyoutor Pro' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tyoutor Pro — AI Lesson Planning for ESL & TEFL Teachers',
    description: 'Generate complete, L1-aware lesson plans in 60 seconds. Built exclusively for ESL and TEFL teachers.',
    images: ['/og-default.jpg'],
  },
}

const HOMEPAGE_FAQS = [
  {
    q: 'What is Tyoutor Pro?',
    a: 'Tyoutor Pro is an AI lesson planning platform built exclusively for ESL and TEFL teachers. It generates complete lesson plans, worksheets, demo lessons, and error-correction reports tailored to your specific class — all in under 60 seconds.',
  },
  {
    q: 'How does the L1-aware feature work?',
    a: 'You set up a class profile once: level, age group, nationality, weak areas. Tyoutor Pro then uses your students’ mother tongue (L1) to predict the exact grammar and pronunciation errors they’re likely to make, and automatically scaffolds every lesson and worksheet around those interference patterns.',
  },
  {
    q: 'Is Tyoutor Pro free?',
    a: 'Yes — the free tier includes 5 lesson plans, 5 worksheets, basic Error Coach access, and unlimited Class Profiles, with no credit card required. Pro is $19/month and unlocks unlimited generation across all 6 tools, PDF export, saved library, and priority generation.',
  },
  {
    q: 'What types of lessons can I generate?',
    a: 'All of them. The toolkit includes the Lesson Generator (full plans with warmers, activities, language focus), Worksheet Builder (gap fills, matching, multiple choice, reading comprehension, with answer keys), Error Correction Coach (analyses student writing), Demo Lesson Builder, Class Profiles, and Shared Resources.',
  },
  {
    q: 'Can I use Tyoutor Pro for CELTA or DELTA?',
    a: 'Yes. The Demo Lesson Builder is designed for exactly that — interview demos, observed lessons, CELTA TPs, and DELTA assessments. Every demo plan includes methodology notes (a "Why this works" sidebar) so you can explain your pedagogical decisions to assessors and hiring panels with confidence.',
  },
  {
    q: 'Which countries do your teachers come from?',
    a: 'Tyoutor Pro is used by 2,400+ ESL and TEFL teachers across 50+ countries — from private tutors in Spain and Korea to in-school teachers in Vietnam, Saudi Arabia, Brazil, Japan, and beyond.',
  },
]

export default function LandingPage() {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tyoutor Pro',
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    description: 'AI-powered lesson planning built exclusively for ESL and TEFL teachers.',
    sameAs: [],
  }

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Tyoutor Pro',
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: 'Generate complete, L1-aware lesson plans in 60 seconds. Worksheets, error coaching, demo lessons, and class profiles built for ESL & TEFL teachers.',
    offers: [
      { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', description: '5 free lesson plans, 5 free worksheets, class profiles' },
      { '@type': 'Offer', name: 'Pro',  price: '12', priceCurrency: 'USD', description: 'Unlimited lessons and worksheets, all 6 tools, PDF export, priority generation' },
    ],
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '120' },
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOMEPAGE_FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <div className="min-h-screen text-[#2D2D2D] overflow-x-hidden" style={{ background: '#FAFAF8' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <Navbar />

      <main>
      {/* ── Hero ── */}
      <section className="relative isolate pt-28 pb-20 px-6 overflow-hidden">
        <div aria-hidden style={{ position:'absolute',width:600,height:400,top:-80,right:-120,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#FFE5D9,#FECDA6)',opacity:0.18,pointerEvents:'none',animation:'blobFloat 8s ease-in-out 0s infinite alternate' }} />
        <div aria-hidden style={{ position:'absolute',width:500,height:400,top:120,left:-100,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#E8DFF5,#D0BFFF)',opacity:0.12,pointerEvents:'none',animation:'blobFloat 8s ease-in-out 3s infinite alternate' }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold mb-8" style={{ background:'rgba(45,106,79,0.08)', border:'1px solid rgba(45,106,79,0.18)', color:'#2D6A4F' }}>
            <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" style={{ animation:'pulse-dot 2s ease-in-out infinite' }} />
            Built exclusively for ESL &amp; TEFL teachers
          </div>

          <h1 className="font-extrabold tracking-tight mb-6" style={{ fontSize:'clamp(2.2rem,6vw,4.75rem)', letterSpacing:'-2px', lineHeight:1.08 }}>
            <span style={{ color:'#2D2D2D' }}>AI Lesson Planning</span>
            <br />
            <span style={{ color:'#2D6A4F', textDecoration:'underline', textDecorationColor:'rgba(45,106,79,0.25)', textDecorationThickness:'3px', textUnderlineOffset:'7px' }}>
              for ESL &amp; TEFL Teachers
            </span>
          </h1>

          <p className="max-w-xl mx-auto mb-10 font-medium" style={{ fontSize:18, color:'#6B6860', lineHeight:1.65 }}>
            The L1-aware ESL lesson plan generator built for working teachers. Set up your class once — level, nationality, weak areas, goals — and Tyoutor Pro tailors every lesson, worksheet, and demo automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center px-8 py-4" style={{ fontSize:15, fontWeight:800 }}>
              Start Free Today →
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center font-bold px-8 py-4 rounded-full transition-all" style={{ background:'rgba(255,255,255,0.80)', backdropFilter:'blur(12px)', border:'1px solid #E8E4DE', color:'#2D2D2D', fontSize:15 }}>
              See How It Works
            </a>
          </div>

          {/* Stats strip */}
          <div className="inline-flex flex-wrap items-center justify-center gap-0 mt-12 rounded-2xl overflow-hidden" style={{ background:'rgba(255,255,255,0.80)', backdropFilter:'blur(12px)', border:'1px solid #E8E4DE' }}>
            {[
              { value: '2,400+', label: 'Teachers' },
              { value: '50+', label: 'Countries' },
              { value: '18hrs', label: 'Avg. saved/month' },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center">
                {i > 0 && <div style={{ width:1, height:32, background:'#E8E4DE', flexShrink:0 }} />}
                <div className="text-center px-7 py-4">
                  <div style={{ fontSize:24, fontWeight:900, color:'#2D2D2D', letterSpacing:'-0.5px' }}>{s.value}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#8C8880', marginTop:2, textTransform:'uppercase', letterSpacing:'0.8px' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual — actual lesson content preview, not skeleton bars */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="bg-white rounded-2xl p-6" style={{ border:'1px solid #E8E4DE', boxShadow:'0 12px 48px rgba(45,106,79,0.08)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 rounded-lg h-6 ml-2 flex items-center px-3" style={{ background:'#F4F2EE' }}>
                <span className="text-xs font-medium" style={{ color:'#8C8880' }}>Monday B1 Adults — Lesson Generator</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Warmer Activity', lines: ['Match the idioms: job hunt vocab', 'Pair discussion prompt: 3 min', 'Class feedback + board notes'], accent: '#2D6A4F', bg: '#EDF6F0' },
                { title: 'Main Activity', lines: ['Role play: job interview pairs', 'Language scaffolding card', 'Peer assessment checklist'], accent: '#E07A5F', bg: '#FEF3EE' },
                { title: 'Language Focus', lines: ['Present Perfect vs Simple Past', 'Common errors — Chinese L1 notes', 'Error correction drill (written)'], accent: '#7D3C98', bg: '#F8F0FD' },
              ].map(({ title, lines, accent, bg }) => (
                <div key={title} className="rounded-xl p-4" style={{ background: bg, border:`1px solid ${accent}18` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>{title}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {lines.map(line => (
                      <li key={line} className="text-xs font-medium" style={{ color:'#4A473E' }}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 -z-10 blur-3xl rounded-3xl" style={{ background:'rgba(45,106,79,0.04)' }} />
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-20 px-6" style={{ background:'#F4F2EE' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#2D6A4F' }}>The Problem</div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color:'#2D2D2D', letterSpacing:'-0.5px' }}>Sound familiar?</h2>
            <p className="text-lg font-medium" style={{ color:'#6B6860' }}>Every ESL teacher knows these Sunday night feelings.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: 'Spending your Sunday nights building lessons from scratch', desc: 'Hours on lesson planning that could be spent resting, preparing, or actually living your life.' },
              { icon: FileText, title: "Downloading random worksheets that don't match your students", desc: 'Generic materials that frustrate your students and make your lessons feel disconnected.' },
              { icon: Presentation, title: 'Scrambling to prep a demo lesson for a job interview', desc: 'Trying to create an impressive, methodologically sound lesson in 24 hours with no support.' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 card-lift" style={{ border:'1px solid #E8E4DE' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background:'#FEF2F2', border:'1px solid #FECACA' }}>
                  <item.icon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-bold mb-2 leading-snug" style={{ color:'#2D2D2D' }}>&ldquo;{item.title}&rdquo;</h3>
                <p className="text-sm leading-relaxed" style={{ color:'#6B6860' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#2D6A4F' }}>How It Works</div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color:'#2D2D2D', letterSpacing:'-0.5px' }}>From signup to lesson in 60 seconds.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Desktop step connector */}
            <div aria-hidden className="hidden md:block absolute" style={{ top:40, left:'calc(33% + 20px)', right:'calc(33% + 20px)', height:1, background:'linear-gradient(90deg,#E8E4DE,rgba(45,106,79,0.3),#E8E4DE)' }} />
            {[
              { icon: Users, title: 'Set up your class profile', desc: 'Enter your class once: level, nationality, weak areas, focus skills. Tyoutor Pro remembers everything.' },
              { icon: Zap, title: 'AI generates tailored content', desc: 'Every lesson, worksheet, and exercise is automatically personalised to your exact class profile — no manual tweaking needed.' },
              { icon: Download, title: 'Download, print, or share', desc: 'Export as a beautifully formatted PDF or copy to your clipboard. Ready in seconds.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 relative" style={{ background:'#EDF6F0', border:'1px solid rgba(45,106,79,0.2)' }}>
                  <item.icon className="w-8 h-8" style={{ color:'#2D6A4F' }} />
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full text-xs font-extrabold text-white flex items-center justify-center" style={{ background:'#2D6A4F' }}>{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold mb-3" style={{ color:'#2D2D2D' }}>{item.title}</h3>
                <p className="leading-relaxed font-medium" style={{ color:'#6B6860' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6" style={{ background:'#F4F2EE' }}>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#2D6A4F' }}>The Toolkit</div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color:'#2D2D2D', letterSpacing:'-0.5px' }}>Every ESL & TEFL lesson planning tool, in one place</h2>
            <p className="text-lg font-medium" style={{ color:'#6B6860' }}>From the AI lesson planner to the ESL worksheet generator and error correction tool — all tailored to your class.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users,        title: 'Class Profiles',          desc: 'Set up your class once — level, nationality, weak areas, focus skills. Every tool auto-fills from your profile.', tag: 'New',          iconBg:'#EDF6F0', iconColor:'#2D6A4F' },
              { icon: BookOpen,     title: 'AI Lesson Generator',     desc: 'A free ESL lesson plan generator — complete plans with warmers, activities, language focus, and L1-aware tips in 60 seconds.', tag: 'Most Popular', iconBg:'#EDF6F0', iconColor:'#2D6A4F' },
              { icon: FileText,     title: 'Worksheet Builder',       desc: 'Gap fills, matching, multiple choice, reading comprehension — custom worksheets at any level, with answer keys.',  tag: null,           iconBg:'#EBF5FB', iconColor:'#1A6FA8' },
              { icon: MessageSquare,title: 'Error Correction Coach',  desc: 'Upload a photo of handwritten work or paste text. Get errors highlighted, categorised, and explained.',           tag: null,           iconBg:'#F5EEF8', iconColor:'#7D3C98' },
              { icon: Star,         title: 'Demo Lesson Builder',     desc: 'A demo lesson for your TEFL interview — methodology-sound, interview-ready, with a "Why this works" sidebar.', tag: null,           iconBg:'#FFFBEB', iconColor:'#B7791F' },
              { icon: GraduationCap,title: 'Shared Resources',        desc: 'Browse and share community lesson materials from teachers around the world.',                                     tag: null,           iconBg:'#EBF8FF', iconColor:'#2B6CB0' },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 card-lift relative" style={{ border:'1px solid #E8E4DE' }}>
                {feature.tag && (
                  <span className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-0.5 rounded-full ${feature.tag === 'New' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {feature.tag}
                  </span>
                )}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: feature.iconBg, border:`1px solid ${feature.iconColor}22` }}>
                  <feature.icon className="w-5 h-5" style={{ color: feature.iconColor }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color:'#2D2D2D' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed font-medium" style={{ color:'#6B6860' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#2D6A4F' }}>Social Proof</div>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color:'#2D2D2D', letterSpacing:'-0.5px' }}>What teachers are saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', role: 'TEFL Teacher, Vietnam',         text: 'I used to spend 3 hours on Sunday planning. Now it takes 20 minutes. The class profiles mean every lesson is already tailored to my B1 students before I even start.', rating: 5, initials: 'SM', color: '#2D6A4F' },
              { name: 'James K.', role: 'ESL Teacher, South Korea',       text: 'The demo lesson builder got me a job at my dream school. The "Why this works" notes helped me explain my methodology confidently in the interview.',               rating: 5, initials: 'JK', color: '#E07A5F' },
              { name: 'Maria L.', role: 'Business English Tutor, Spain',  text: "My students' writing has improved so much since I started using the Error Coach. The categorised feedback saves me an hour of marking every week.",                rating: 5, initials: 'ML', color: '#7D3C98' },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 card-lift" style={{ border:'1px solid #E8E4DE' }}>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="leading-relaxed mb-5 italic font-medium" style={{ color:'#4A473E', fontSize:14 }}>&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0" style={{ background: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color:'#2D2D2D' }}>{t.name}</div>
                    <div className="text-xs font-medium" style={{ color:'#8C8880' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6" style={{ background:'#F4F2EE' }}>
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#2D6A4F' }}>Pricing</div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color:'#2D2D2D', letterSpacing:'-0.5px' }}>Simple, Honest Pricing</h2>
            <p className="text-lg font-medium" style={{ color:'#6B6860' }}>Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 card-lift flex flex-col" style={{ border:'1px solid #E8E4DE' }}>
              <div className="h-7 mb-4 flex-shrink-0" />
              <div className="mb-6">
                <h3 className="text-xl font-extrabold mb-1" style={{ color:'#2D2D2D' }}>Free</h3>
                <div className="text-4xl font-extrabold" style={{ color:'#2D2D2D' }}>$0</div>
                <div className="text-sm mt-1 font-medium" style={{ color:'#8C8880' }}>Forever free</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['5 lessons free', '5 worksheets free', 'Basic lesson generator', 'Error Coach (3 uses)', 'Demo Lesson (1 use)', 'Class Profiles (unlimited)'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm font-medium" style={{ color:'#4A473E' }}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color:'#2D6A4F' }} />
                    {f}
                  </li>
                ))}
                {['PDF export', 'Save to library'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm font-medium line-through" style={{ color:'#C4C0BA' }}>
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ border:'1px solid #E8E4DE' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center font-bold px-6 py-3 rounded-xl transition-all hover:border-[#2D6A4F] hover:text-[#2D6A4F]" style={{ border:'1.5px solid #E8E4DE', color:'#4A473E' }}>
                Get Started Free
              </Link>
            </div>
            {/* Pro — dark forest card */}
            <div className="rounded-2xl p-8 card-lift flex flex-col" style={{ background:'#1B4332', border:'1.5px solid #2D6A4F' }}>
              <div className="flex justify-center mb-4 flex-shrink-0">
                <span className="text-white text-xs font-extrabold px-4 py-1.5 rounded-full" style={{ background:'#2D6A4F' }}>
                  MOST POPULAR
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-extrabold mb-1 text-white">Pro</h3>
                <div className="text-4xl font-extrabold" style={{ color:'#52B788' }}>
                  $12<span className="text-xl font-semibold" style={{ color:'rgba(255,255,255,0.45)' }}>/month</span>
                </div>
                <div className="text-sm mt-1 font-medium" style={{ color:'rgba(255,255,255,0.45)' }}>Cancel anytime</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Unlimited lessons', 'Unlimited worksheets', 'All 6 tools — unlimited', 'PDF export on everything', 'Save & organise your library', 'Class Profiles — AI auto-fill', 'Priority generation'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm font-medium" style={{ color:'rgba(255,255,255,0.85)' }}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color:'#52B788' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center font-bold px-6 py-3.5 rounded-xl transition-all text-white" style={{ background:'#2D6A4F', boxShadow:'0 4px 20px rgba(45,106,79,0.45)' }}>
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'#2D6A4F' }}>FAQ</div>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color:'#2D2D2D', letterSpacing:'-0.5px' }}>Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {HOMEPAGE_FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl p-6" style={{ border:'1px solid #E8E4DE' }}>
                <h3 className="font-bold mb-2" style={{ color:'#2D2D2D', fontSize:16 }}>{q}</h3>
                <p className="text-sm leading-relaxed font-medium" style={{ color:'#6B6860' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6" style={{ background:'#F4F2EE' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-extrabold mb-6" style={{ fontSize:'clamp(2rem,5vw,3.5rem)', letterSpacing:'-1.5px', color:'#2D2D2D', lineHeight:1.1 }}>
            Ready to reclaim your{' '}
            <span style={{ color:'#2D6A4F', textDecoration:'underline', textDecorationColor:'rgba(45,106,79,0.3)', textDecorationThickness:'4px', textUnderlineOffset:'8px' }}>Sundays?</span>
          </h2>
          <p className="text-xl mb-10 font-medium" style={{ color:'#6B6860' }}>Join thousands of TEFL teachers who plan smarter with Tyoutor Pro.</p>
          <Link href="/auth/signup" className="btn-primary inline-flex items-center gap-2 px-10 py-5 text-xl">
            Start Free Today
            <Zap className="w-5 h-5" />
          </Link>
        </div>
      </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-12 px-6" style={{ borderTop:'1px solid #E8E4DE', background:'white' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" href="/" />
          <nav aria-label="Footer" className="flex gap-8 text-sm font-semibold" style={{ color:'#6B6860' }}>
            <Link href="/pricing" className="transition-colors hover:text-[#2D2D2D]">Pricing</Link>
            <Link href="/blog" className="transition-colors hover:text-[#2D2D2D]">Blog</Link>
            <Link href="/auth/login" className="transition-colors hover:text-[#2D2D2D]">Log in</Link>
            <Link href="/auth/signup" className="transition-colors hover:text-[#2D2D2D]">Sign up</Link>
          </nav>
          <p className="text-sm font-medium" style={{ color:'#8C8880' }}>© {new Date().getFullYear()} Tyoutor Pro. Built for teachers.</p>
        </div>
      </footer>
    </div>
  )
}
