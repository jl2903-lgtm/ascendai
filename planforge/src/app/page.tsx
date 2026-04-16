import Link from 'next/link'
import { BookOpen, FileText, MessageSquare, GraduationCap, Zap, CheckCircle, Clock, Download, Star, Users, Presentation } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Logo } from '@/components/ui/Logo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative isolate pt-24 pb-24 px-6 overflow-hidden">
        {/* Decorative blobs */}
        <div aria-hidden style={{ position:'absolute',width:600,height:400,top:-80,right:-120,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#FFE5D9,#FECDA6)',opacity:0.18,pointerEvents:'none',animation:'blobFloat 8s ease-in-out 0s infinite alternate' }} />
        <div aria-hidden style={{ position:'absolute',width:500,height:400,top:120,left:-100,borderRadius:'50%',filter:'blur(80px)',background:'radial-gradient(ellipse,#E8DFF5,#D0BFFF)',opacity:0.15,pointerEvents:'none',animation:'blobFloat 8s ease-in-out 3s infinite alternate' }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
        {/* Floating icons */}
        <div aria-hidden style={{ position:'absolute',right:'8%',top:'15%',fontSize:36,opacity:0.08,pointerEvents:'none',animation:'iconFloat 6s ease-in-out 0s infinite alternate' }}>📚</div>
        <div aria-hidden style={{ position:'absolute',right:'15%',top:'55%',fontSize:28,opacity:0.07,pointerEvents:'none',animation:'iconFloat 6s ease-in-out 2s infinite alternate' }}>✏️</div>
        <div aria-hidden style={{ position:'absolute',right:'4%',top:'70%',fontSize:32,opacity:0.08,pointerEvents:'none',animation:'iconFloat 6s ease-in-out 4s infinite alternate' }}>🌍</div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold mb-8" style={{ background:'rgba(45,106,79,0.08)', border:'1px solid rgba(45,106,79,0.15)', color:'#2D6A4F' }}>
            <span className="w-2 h-2 rounded-full bg-teal-500" style={{ animation:'pulse-dot 2s ease-in-out infinite' }} />
            Built exclusively for ESL &amp; TEFL teachers
          </div>

          {/* Headline */}
          <h1 className="font-extrabold tracking-tight mb-6 leading-tight" style={{ fontSize:'clamp(2rem,6vw,4.5rem)', letterSpacing:'-1.5px' }}>
            <span style={{ color:'#2D2D2D' }}>Your students are unique.</span>
            <br />
            <span className="gradient-text">Their lessons should be too.</span>
          </h1>

          <p className="max-w-xl mx-auto mb-10 leading-relaxed font-medium" style={{ fontSize:18, color:'#7A7A7A', lineHeight:1.6 }}>
            Set up your class once. Tyoutor Pro remembers their level, nationality, weak areas, and goals — then tailors every lesson automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base" style={{ fontSize:15, fontWeight:800 }}>
              Start Free Today →
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto inline-flex items-center justify-center font-bold px-8 py-4 rounded-full text-base transition-all" style={{ background:'rgba(255,255,255,0.75)', backdropFilter:'blur(12px)', border:'1px solid #E8E4DE', color:'#2D2D2D', fontSize:15 }}>
              See How It Works
            </a>
          </div>

          {/* Stats strip */}
          <div className="flex items-center justify-center gap-10 mt-12 flex-wrap">
            {[
              { value: '2,400+', label: 'Teachers' },
              { value: '50+', label: 'Countries' },
              { value: '18hrs', label: 'Avg. saved/month' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div style={{ fontSize: 22, fontWeight: 900, color: '#2D2D2D' }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card-hover">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 bg-gray-100 rounded-lg h-6 ml-2 flex items-center px-3">
                <span className="text-xs text-gray-400 font-medium">Monday B1 Adults — Lesson Generator</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Warmer Activity', 'Main Activity', 'Language Focus'].map((title, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 card-lift">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-teal-700 text-xs font-bold uppercase tracking-wider">{title}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 bg-gray-200 rounded-full w-full" />
                    <div className="h-2.5 bg-gray-200 rounded-full w-4/5" />
                    <div className="h-2.5 bg-gray-200 rounded-full w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 -z-10 bg-teal-500/5 blur-3xl rounded-3xl" />
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-dot-pattern">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Sound familiar?</h2>
            <p className="text-gray-600 text-lg font-medium">Every ESL teacher knows these Sunday night feelings.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: 'Spending your Sunday nights building lessons from scratch', desc: 'Hours on lesson planning that could be spent resting, preparing, or actually living your life.' },
              { icon: FileText, title: "Downloading random worksheets that don't match your students", desc: 'Generic materials that frustrate your students and make your lessons feel disconnected.' },
              { icon: Presentation, title: 'Scrambling to prep a demo lesson for a job interview', desc: 'Trying to create an impressive, methodologically sound lesson in 24 hours with no support.' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 card-lift">
                <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 leading-snug">&ldquo;{item.title}&rdquo;</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg font-medium">From class setup to complete lesson in under 60 seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Users, title: 'Set up your class profile', desc: 'Enter your class once: level, nationality, weak areas, focus skills. Tyoutor Pro remembers everything.' },
              { step: '02', icon: Zap, title: 'AI generates tailored content', desc: 'Every lesson, worksheet, and exercise is automatically personalised to your exact class profile — no manual tweaking needed.' },
              { step: '03', icon: Download, title: 'Download, print, or share', desc: 'Export as a beautifully formatted PDF or copy to your clipboard. Ready in seconds.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-50 border border-teal-200 mb-6 relative">
                  <item.icon className="w-8 h-8 text-teal-600" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-teal-600 rounded-full text-xs font-extrabold text-white flex items-center justify-center">{item.step.slice(1)}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-dot-pattern">
        <div className="relative max-w-6xl mx-auto">
          <div className="blob-mint w-[500px] h-[400px] top-0 right-0 opacity-60" />
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Everything a TEFL Teacher Needs</h2>
            <p className="text-gray-600 text-lg font-medium">Seven powerful tools. All tailored to your class.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Class Profiles', desc: 'Set up your class once — level, nationality, weak areas, focus skills. Every tool auto-fills from your profile.', tag: 'New', color: 'teal' },
              { icon: BookOpen, title: 'Lesson Generator', desc: 'Complete lesson plans with warmers, activities, language focus, and L1-aware tips — in 60 seconds.', tag: 'Most Popular', color: 'teal' },
              { icon: FileText, title: 'Worksheet Builder', desc: 'Gap fills, matching, multiple choice, reading comprehension — custom worksheets at any level, with answer keys.', tag: null, color: 'blue' },
              { icon: MessageSquare, title: 'Error Correction Coach', desc: 'Upload a photo of handwritten work or paste text. Get errors highlighted, categorised, and explained.', tag: null, color: 'purple' },
              { icon: Star, title: 'Demo Lesson Builder', desc: 'Interview-ready demo lessons with a "Why this works" sidebar. Impress any hiring panel.', tag: null, color: 'amber' },
{ icon: GraduationCap, title: 'Shared Resources', desc: 'Browse and share community lesson materials from teachers around the world.', tag: null, color: 'sky' },
            ].map((feature, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 card-lift relative">
                {feature.tag && (
                  <span className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-0.5 rounded-full ${feature.tag === 'New' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {feature.tag}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  feature.color === 'teal' ? 'bg-teal-50 border border-teal-200' :
                  feature.color === 'blue' ? 'bg-blue-50 border border-blue-200' :
                  feature.color === 'purple' ? 'bg-purple-50 border border-purple-200' :
                  feature.color === 'amber' ? 'bg-amber-50 border border-amber-200' :
                  feature.color === 'rose' ? 'bg-rose-50 border border-rose-200' :
                  'bg-sky-50 border border-sky-200'
                }`}>
                  <feature.icon className={`w-5 h-5 ${
                    feature.color === 'teal' ? 'text-teal-600' :
                    feature.color === 'blue' ? 'text-blue-600' :
                    feature.color === 'purple' ? 'text-purple-600' :
                    feature.color === 'amber' ? 'text-amber-600' :
                    feature.color === 'rose' ? 'text-rose-600' :
                    'text-sky-600'
                  }`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Teachers Love Tyoutor Pro</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', role: 'TEFL Teacher, Vietnam', text: 'I used to spend 3 hours on Sunday planning. Now it takes 20 minutes. The class profiles mean every lesson is already tailored to my B1 students before I even start.', rating: 5 },
              { name: 'James K.', role: 'ESL Teacher, South Korea', text: 'The demo lesson builder got me a job at my dream school. The "Why this works" notes helped me explain my methodology confidently in the interview.', rating: 5 },
              { name: 'Maria L.', role: 'Business English Tutor, Spain', text: "My students' writing has improved so much since I started using the Error Coach. The categorised feedback saves me an hour of marking every week.", rating: 5 },
            ].map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 card-lift">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-4 italic font-medium">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-bold text-sm text-gray-900">{t.name}</div>
                  <div className="text-gray-500 text-xs font-medium">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-dot-pattern" id="pricing">
        <div className="relative max-w-4xl mx-auto">
          <div className="blob-lavender w-[400px] h-[400px] top-0 left-1/2 -translate-x-1/2 opacity-50" />
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Simple, Honest Pricing</h2>
            <p className="text-gray-600 text-lg font-medium">Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 card-lift">
              <div className="mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 mb-1">Free</h3>
                <div className="text-4xl font-extrabold text-gray-900">$0</div>
                <div className="text-gray-500 text-sm mt-1 font-medium">Forever free</div>
              </div>
              <ul className="space-y-3 mb-8">
                {['5 lessons per month', '5 worksheets per month', 'Basic lesson generator', 'Error Coach (3/month)', 'Demo Lesson (1/month)', 'Class Profiles (unlimited)'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                    <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {['PDF export', 'Save to library'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-400 line-through font-medium">
                    <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center border-2 border-gray-200 hover:border-teal-500 hover:text-teal-700 text-gray-700 font-bold px-6 py-3 rounded-xl transition-all">
                Get Started Free
              </Link>
            </div>
            <div className="bg-gradient-to-b from-teal-50 to-white border-2 border-teal-500 rounded-2xl p-8 relative card-lift">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-extrabold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 mb-1">Pro</h3>
                <div className="text-4xl font-extrabold text-teal-600">$19<span className="text-xl text-gray-500 font-semibold">/month</span></div>
                <div className="text-gray-500 text-sm mt-1 font-medium">Cancel anytime</div>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited lessons', 'Unlimited worksheets', 'All 6 tools — unlimited', 'PDF export on everything', 'Save & organise your library', 'Class Profiles — AI auto-fill', 'Priority generation'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-800 font-medium">
                    <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-teal-600/20 hover:scale-105">
                Start 7-Day Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Ready to reclaim your{' '}
            <span className="text-gradient">Sundays?</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 font-medium">Join thousands of TEFL teachers who plan smarter with Tyoutor Pro.</p>
          <Link href="/auth/signup" className="btn-primary inline-flex items-center gap-2 px-10 py-5 text-xl">
            Start Free Today
            <Zap className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" href="/" />
          <div className="flex gap-8 text-sm font-semibold text-gray-600">
            <Link href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/auth/login" className="hover:text-gray-900 transition-colors">Log in</Link>
            <Link href="/auth/signup" className="hover:text-gray-900 transition-colors">Sign up</Link>
          </div>
          <p className="text-sm text-gray-500 font-medium">© {new Date().getFullYear()} Tyoutor Pro. Built for teachers.</p>
        </div>
      </footer>
    </div>
  )
}
