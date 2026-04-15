import Link from 'next/link'
import { BookOpen, CheckCircle, X } from 'lucide-react'
import type { Metadata } from 'next'
import { PricingUpgradeButton } from '@/components/pricing/PricingUpgradeButton'

export const metadata: Metadata = {
  title: 'Pricing — PlanForge',
  description: 'Start free with 5 lessons per month. Upgrade to Pro for unlimited AI-powered lesson plans, worksheets, and all 6 teaching tools.',
}

const FREE_FEATURES = [
  { text: '5 lessons per month', included: true },
  { text: '5 worksheets per month', included: true },
  { text: 'Basic lesson generator', included: true },
  { text: 'Error Coach (3 uses/month)', included: true },
  { text: 'Demo Lesson (1 use/month)', included: true },
  { text: 'Job Assistant (1 use/month)', included: true },
  { text: 'PDF export', included: false },
  { text: 'Save & organise library', included: false },
  { text: 'L1-aware grammar explainer', included: false },
  { text: 'Cultural context filter', included: false },
]

const PRO_FEATURES = [
  { text: 'Unlimited lesson generation', included: true },
  { text: 'Unlimited worksheets', included: true },
  { text: 'All 6 tools — unlimited', included: true },
  { text: 'PDF export on everything', included: true },
  { text: 'Save & organise your library', included: true },
  { text: 'L1-aware grammar explainer', included: true },
  { text: 'Cultural context filter', included: true },
  { text: 'Priority AI generation', included: true },
  { text: 'Cancel anytime', included: true },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Nav */}
      <nav className="border-b border-gray-200/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-teal-400">PlanForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-white transition-colors px-4 py-2">Log in</Link>
            <Link href="/auth/signup" className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Start Free</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-xl text-gray-500">
            Start free. Upgrade when you need more. Cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="mb-8">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Free</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-extrabold">$0</span>
              </div>
              <p className="text-gray-500 text-sm">Forever free · No credit card</p>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f.text} className={`flex items-center gap-3 text-sm ${f.included ? 'text-gray-700' : 'text-gray-400'}`}>
                  {f.included ? (
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                  <span className={f.included ? '' : 'line-through'}>{f.text}</span>
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="block w-full text-center border border-gray-200 hover:border-teal-500 text-gray-500 hover:text-white font-semibold px-6 py-3.5 rounded-xl transition-colors">
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative bg-gradient-to-b from-teal-900/40 via-[#1E293B] to-white border border-teal-600/60 rounded-2xl p-8 shadow-xl shadow-teal-200/60">
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <span className="bg-teal-600 text-white text-xs font-bold px-5 py-1.5 rounded-full">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-8">
              <div className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">Pro</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-extrabold text-teal-400">$19</span>
                <span className="text-gray-500 text-lg">/month</span>
              </div>
              <p className="text-gray-500 text-sm">Cancel anytime · No hidden fees</p>
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  {f.text}
                </li>
              ))}
            </ul>

            <PricingUpgradeButton
              trial
              className="block w-full text-center bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-teal-600/25"
            >
              Start 7-Day Free Trial
            </PricingUpgradeButton>
            <p className="text-xs text-center text-gray-400 mt-3">No charge until trial ends</p>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-10">Everything you get with Pro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Lesson Generator', items: ['Unlimited lessons', 'All levels A1–C2', 'L1-aware notes', 'Cultural sensitivity flags', 'PDF export'] },
              { title: 'Teaching Tools', items: ['Worksheet Builder (unlimited)', 'Error Correction Coach', 'Demo Lesson Builder', 'Job Application Assistant', 'Save to library'] },
              { title: 'Pro Features', items: ['Priority AI generation', 'PDF export on all outputs', 'Saved library with search', 'Default preferences', 'Stripe billing portal'] },
            ].map(group => (
              <div key={group.title} className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-semibold text-teal-400 mb-4 text-sm uppercase tracking-wider">{group.title}</h3>
                <ul className="space-y-2.5">
                  {group.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I cancel my Pro subscription at any time?', a: 'Yes, absolutely. Cancel anytime from your settings page. You keep Pro access until the end of your billing period.' },
              { q: 'What happens to my saved lessons if I cancel?', a: "Your saved lessons remain in your account. You just won't be able to save new ones or export PDFs on the free plan." },
              { q: 'Is the free plan genuinely free?', a: 'Yes. No credit card required. 5 lessons and 5 worksheets every month, forever.' },
              { q: 'How is the AI lesson content different from templates?', a: 'Every lesson is generated fresh by Claude AI based on your specific inputs — student level, nationality, topic, age group, and class size. No two lessons are the same.' },
              { q: 'Does the L1-aware feature work for my students?', a: "We support 25 first languages. The AI provides specific linguistic challenges and teaching tips based on your students' mother tongue." },
            ].map(faq => (
              <div key={faq.q} className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold mb-4">Still not sure?</h2>
          <p className="text-gray-500 mb-6">Try the free plan. No credit card. No pressure.</p>
          <Link href="/auth/signup" className="inline-block bg-teal-600 hover:bg-teal-500 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-teal-600/25">
            Start Free Today
          </Link>
        </div>
      </div>
    </div>
  )
}
