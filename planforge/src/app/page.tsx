import Link from 'next/link'
import { BookOpen, FileText, MessageSquare, Briefcase, GraduationCap, Zap, CheckCircle, Clock, Download, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-50/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-teal-400">PlanForge</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-white transition-colors px-4 py-2">
              Log in
            </Link>
            <Link href="/auth/signup" className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal-600/10 border border-teal-600/30 rounded-full px-4 py-1.5 text-teal-400 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Built for TEFL teachers worldwide
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Plan a Week of{' '}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
              ESL Lessons
            </span>
            {' '}in 20 Minutes.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered lesson plans, worksheets, and teaching materials built for TEFL teachers worldwide. Stop planning, start teaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-teal-600/25">
              Start Free — No Credit Card
            </Link>
            <a href="#how-it-works" className="border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all">
              See How It Works
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-6">5 free lessons per month · No credit card required</p>
        </div>

        {/* Hero visual */}
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1 bg-gray-50 rounded-md h-6 ml-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Warmer Activity', 'Main Activity', 'Language Focus'].map((title, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-teal-400 text-xs font-semibold uppercase tracking-wider">{title}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 bg-gray-100 rounded-full w-full" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-4/5" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 -z-10 bg-teal-600/5 blur-3xl rounded-3xl" />
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-[#0D1526]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sound familiar?</h2>
            <p className="text-gray-500 text-lg">Every ESL teacher knows these Sunday night feelings.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: 'Spending your Sunday nights building lessons from scratch',
                desc: 'Hours on lesson planning that could be spent resting, preparing, or actually living your life.',
              },
              {
                icon: FileText,
                title: "Downloading random worksheets that don't match your students' level",
                desc: 'Generic materials that frustrate your students and make your lessons feel disconnected.',
              },
              {
                icon: Briefcase,
                title: 'Scrambling to prep a demo lesson for a job interview',
                desc: 'Trying to create an impressive, methodologically sound lesson in 24 hours with no support.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-teal-600/50 transition-colors">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 leading-snug">&ldquo;{item.title}&rdquo;</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg">From idea to complete lesson in under 60 seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: GraduationCap,
                title: 'Tell us about your class',
                desc: 'Select student level, age group, nationality, topic, and any special focus areas.',
              },
              {
                step: '02',
                icon: Zap,
                title: 'AI generates a complete lesson in 60 seconds',
                desc: 'Claude AI creates a fully structured, pedagogically sound lesson plan tailored to your specific class.',
              },
              {
                step: '03',
                icon: Download,
                title: 'Download, print, or share instantly',
                desc: 'Export as a beautifully formatted PDF or copy to your clipboard. Ready in seconds.',
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-600/10 border border-teal-600/30 mb-6 relative">
                  <item.icon className="w-8 h-8 text-teal-400" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-teal-600 rounded-full text-xs font-bold text-white flex items-center justify-center">{item.step.slice(1)}</span>
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-[#0D1526]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything a TEFL Teacher Needs</h2>
            <p className="text-gray-500 text-lg">Six powerful tools, one subscription.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: 'Lesson Generator', desc: 'Complete lesson plans with warmers, activities, language focus, exercises, and L1-aware tips — in 60 seconds.', tag: 'Most Popular' },
              { icon: FileText, title: 'Worksheet Builder', desc: 'Gap fills, matching, multiple choice, reading comprehension — custom worksheets at any level, with answer keys.', tag: null },
              { icon: MessageSquare, title: 'Grammar Explainer (L1-Aware)', desc: "Explanations of English grammar tailored to your students' first language. Chinese, Spanish, Arabic and more.", tag: 'Pro' },
              { icon: CheckCircle, title: 'Error Correction Coach', desc: 'Paste student writing. Get errors highlighted, categorised, explained, with a focus area recommendation.', tag: null },
              { icon: Star, title: 'Demo Lesson Builder', desc: 'Interview-ready demo lessons with a "Why this works" sidebar. Impress any hiring panel.', tag: null },
              { icon: Briefcase, title: 'Job Application Assistant', desc: 'Professional cover letters and motivation statements written in a genuine, human tone. Not corporate boilerplate.', tag: null },
            ].map((feature, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-teal-600/50 transition-all hover:-translate-y-1 duration-200 relative">
                {feature.tag && (
                  <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full ${feature.tag === 'Pro' ? 'bg-teal-600/20 text-teal-400 border border-teal-600/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {feature.tag}
                  </span>
                )}
                <div className="w-10 h-10 bg-teal-600/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Teachers Love PlanForge</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', role: 'TEFL Teacher, Vietnam', text: 'I used to spend 3 hours on Sunday planning. Now it takes 20 minutes. The L1-aware tips for Vietnamese learners are incredibly accurate.', rating: 5 },
              { name: 'James K.', role: 'ESL Teacher, South Korea', text: 'The demo lesson builder got me a job at my dream school. The "Why this works" notes helped me explain my methodology confidently in the interview.', rating: 5 },
              { name: 'Maria L.', role: 'Business English Tutor, Spain', text: "My students' writing has improved so much since I started using the Error Coach. The categorised feedback saves me an hour of marking every week.", rating: 5 },
            ].map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-[#0D1526]" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Honest Pricing</h2>
            <p className="text-gray-500 text-lg">Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Free</h3>
                <div className="text-4xl font-extrabold">$0</div>
                <div className="text-gray-500 text-sm mt-1">Forever free</div>
              </div>
              <ul className="space-y-3 mb-8">
                {['5 lessons per month', '5 worksheets per month', 'Basic lesson generator', 'Error Coach (3/month)', 'Demo Lesson (1/month)'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {['PDF export', 'Save to library'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-400 line-through">
                    <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                Get Started Free
              </Link>
            </div>
            <div className="bg-gradient-to-b from-teal-600/20 to-white border border-teal-600/50 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Pro</h3>
                <div className="text-4xl font-extrabold text-teal-400">$19<span className="text-xl text-gray-500 font-normal">/month</span></div>
                <div className="text-gray-500 text-sm mt-1">Cancel anytime</div>
              </div>
              <ul className="space-y-3 mb-8">
                {['Unlimited lessons', 'Unlimited worksheets', 'All 6 tools — unlimited', 'PDF export on everything', 'Save & organise your library', 'L1-aware grammar explainer', 'Cultural context filter', 'Priority generation'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full text-center bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-3.5 rounded-lg transition-colors shadow-lg shadow-teal-600/25">
                Start 7-Day Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to reclaim your{' '}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">Sundays?</span>
          </h2>
          <p className="text-xl text-gray-500 mb-10">Join thousands of TEFL teachers who plan smarter with PlanForge.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold px-10 py-5 rounded-xl text-xl transition-all hover:scale-105 shadow-lg shadow-teal-600/25">
            Start Free Today
            <Zap className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-teal-400">PlanForge</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Log in</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Sign up</Link>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} PlanForge. Built for teachers.</p>
        </div>
      </footer>
    </div>
  )
}
