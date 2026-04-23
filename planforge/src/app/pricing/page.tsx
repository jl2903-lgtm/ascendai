import Link from 'next/link'
import { BookOpen, CheckCircle, X } from 'lucide-react'
import type { Metadata } from 'next'
import { PricingUpgradeButton } from '@/components/pricing/PricingUpgradeButton'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'

export const metadata: Metadata = {
  title: 'Pricing — Tyoutor Pro | Free & Pro Plans for ESL Teachers',
  description: 'Start free with 5 lesson plans. Pro gives you unlimited access to all 6 tools for $19/month. Cancel anytime.',
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: 'Pricing — Tyoutor Pro | Free & Pro Plans for ESL Teachers',
    description: 'Start free with 5 lesson plans. Pro gives you unlimited access to all 6 tools for $19/month. Cancel anytime.',
    type: 'website',
    url: `${SITE_URL}/pricing`,
    siteName: 'Tyoutor Pro',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Tyoutor Pro Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Tyoutor Pro',
    description: 'Start free with 5 lesson plans. Pro gives you unlimited access to all 6 tools.',
    images: ['/og-default.jpg'],
  },
}

const PRODUCT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Tyoutor Pro',
  description: 'AI-powered lesson planning for ESL & TEFL teachers. L1-aware lesson generator, worksheet builder, error coach, demo lesson builder, and class profiles.',
  brand: { '@type': 'Brand', name: 'Tyoutor Pro' },
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
      url: `${SITE_URL}/auth/signup`,
      availability: 'https://schema.org/InStock',
      description: '5 lesson plans, 5 worksheets, basic tools, class profiles',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '12',
      priceCurrency: 'USD',
      url: `${SITE_URL}/auth/signup`,
      availability: 'https://schema.org/InStock',
      description: 'Unlimited lessons, unlimited worksheets, all 6 tools, PDF export, priority generation',
    },
  ],
}

const FREE_FEATURES = [
  { text: '5 lessons free', included: true },
  { text: '5 worksheets free', included: true },
  { text: 'Basic lesson generator', included: true },
  { text: 'Error Coach (3 uses/month)', included: true },
  { text: 'Demo Lesson (1 use/month)', included: true },
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
    <div className="min-h-screen bg-[#F7F6F2] text-[#2D2D2D]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSON_LD) }} />
      {/* Nav */}
      <nav className="border-b border-[#E8E4DE]/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-teal-400">Tyoutor Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-[#6B6860] hover:text-white transition-colors px-4 py-2">Log in</Link>
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
          <p className="text-xl text-[#6B6860]">
            Start free. Upgrade when you need more. Cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-start">

          {/* Free card */}
          <div className="bg-white border border-[#E8E4DE] rounded-2xl p-8 flex flex-col">
            {/* invisible spacer so price aligns with Pro card */}
            <div className="h-8 mb-4" />
            <div className="mb-8">
              <div className="text-sm font-semibold text-[#6B6860] uppercase tracking-wider mb-3">Free</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-extrabold">$0</span>
              </div>
              <p className="text-[#6B6860] text-sm">Forever free · No credit card</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f.text} className={`flex items-center gap-3 text-sm ${f.included ? 'text-[#4A473E]' : 'text-[#8C8880]'}`}>
                  {f.included ? (
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-[#C4C0BA] flex-shrink-0" />
                  )}
                  <span className={f.included ? '' : 'line-through'}>{f.text}</span>
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="block w-full text-center border border-[#E8E4DE] hover:border-teal-500 text-[#6B6860] hover:text-teal-700 font-semibold px-6 py-3.5 rounded-xl transition-colors">
              Get Started Free
            </Link>
          </div>

          {/* Pro card — badge sits inside the card at the top */}
          <div className="bg-gradient-to-b from-teal-900/40 via-[#1E293B] to-[#1E293B] border border-teal-600/60 rounded-2xl p-8 shadow-xl shadow-teal-200/60 flex flex-col">
            <div className="flex justify-center mb-4">
              <span className="bg-teal-500 text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-widest uppercase">
                Most Popular
              </span>
            </div>
            <div className="mb-8">
              <div className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">Pro</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-extrabold text-white">$12</span>
                <span className="text-teal-300/70 text-lg">/month</span>
              </div>
              <p className="text-teal-300/60 text-sm">Cancel anytime · No hidden fees</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-white/90">
                  <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  {f.text}
                </li>
              ))}
            </ul>

            <PricingUpgradeButton
              className="block w-full text-center bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-teal-600/25"
            >
              Upgrade to Pro
            </PricingUpgradeButton>
          </div>

        </div>

        {/* Feature comparison */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-10">Everything you get with Pro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Lesson Generator', items: ['Unlimited lessons', 'All levels A1–C2', 'L1-aware notes', 'Cultural sensitivity flags', 'PDF export'] },
              { title: 'Teaching Tools', items: ['Worksheet Builder (unlimited)', 'Error Correction Coach', 'Demo Lesson Builder', 'Save to library'] },
              { title: 'Pro Features', items: ['Priority AI generation', 'PDF export on all outputs', 'Saved library with search', 'Default preferences', 'Stripe billing portal'] },
            ].map(group => (
              <div key={group.title} className="bg-white border border-[#E8E4DE] rounded-2xl p-6">
                <h3 className="font-semibold text-teal-400 mb-4 text-sm uppercase tracking-wider">{group.title}</h3>
                <ul className="space-y-2.5">
                  {group.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[#4A473E]">
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
              { q: 'Is the free plan genuinely free?', a: 'Yes. No credit card required. You get 5 lessons and 5 worksheets free, no expiry.' },
              { q: 'How is the AI lesson content different from templates?', a: 'Every lesson is generated fresh by Claude AI based on your specific inputs — student level, nationality, topic, age group, and class size. No two lessons are the same.' },
              { q: 'Does the L1-aware feature work for my students?', a: "We support 25 first languages. The AI provides specific linguistic challenges and teaching tips based on your students' mother tongue." },
            ].map(faq => (
              <div key={faq.q} className="bg-white border border-[#E8E4DE] rounded-2xl p-5">
                <h3 className="font-semibold text-[#2D2D2D] mb-2 text-sm">{faq.q}</h3>
                <p className="text-sm text-[#6B6860] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold mb-4">Still not sure?</h2>
          <p className="text-[#6B6860] mb-6">Try the free plan. No credit card. No pressure.</p>
          <Link href="/auth/signup" className="inline-block bg-teal-600 hover:bg-teal-500 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-teal-600/25">
            Start Free Today
          </Link>
        </div>
      </div>
    </div>
  )
}
