import Link from 'next/link'
import { BookOpen, CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'

export const metadata: Metadata = {
  title: 'Pricing — Tyoutor Pro | 7-Day Free Trial for ESL Teachers',
  description: 'Start your 7-day free trial. Full access to all 6 tools. $12/month after trial. Cancel anytime.',
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: 'Pricing — Tyoutor Pro | 7-Day Free Trial for ESL Teachers',
    description: 'Start your 7-day free trial. Full access to all 6 tools. $12/month after trial. Cancel anytime.',
    type: 'website',
    url: `${SITE_URL}/pricing`,
    siteName: 'Tyoutor Pro',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Tyoutor Pro Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Tyoutor Pro',
    description: 'Start your 7-day free trial. $12/month after trial. Cancel anytime.',
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
      name: 'Pro',
      price: '12',
      priceCurrency: 'USD',
      url: `${SITE_URL}/auth/signup`,
      availability: 'https://schema.org/InStock',
      description: '7-day free trial, then $12/month. Unlimited lessons, worksheets, all 6 tools, PDF export, priority generation.',
    },
  ],
}

const PRICING_FAQS = [
  {
    q: 'How much does Tyoutor Pro cost?',
    a: 'Tyoutor Pro is $12/month after a 7-day free trial. During the trial you get full access to all 6 tools with no restrictions. Cancel before day 7 and you won\'t be charged.',
  },
  {
    q: 'Do I need a credit card for the free trial?',
    a: 'Yes — we ask for your card details upfront so there\'s no interruption when your trial converts. You won\'t be charged during the 7-day trial. Cancel any time before day 7 and you pay nothing.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your settings page in one click before day 7 and you won\'t be charged at all. If you cancel after converting, you keep Pro access until the end of your billing period.',
  },
  {
    q: 'What do I get during the trial?',
    a: 'Everything — unlimited lesson generation, unlimited worksheets, all 6 tools, PDF export on everything, saved library, class profiles, and priority AI generation.',
  },
  {
    q: 'Do you offer discounts for schools or annual billing?',
    a: 'Yes — annual billing saves about two months versus monthly, and we offer school and language-academy site licenses. Email support@tyoutorpro.io with your team size for a quote.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards via Stripe. Billing is secure, GDPR-compliant, and you can manage or cancel your subscription from your settings at any time.',
  },
]

const PRICING_FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PRICING_FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const COMPARISON_ROWS: { label: string; manual: string; tyoutor: string }[] = [
  { label: 'Time to plan one lesson',         manual: '45–90 minutes',             tyoutor: '60 seconds' },
  { label: 'L1-aware error prediction',       manual: 'Manual research per class', tyoutor: 'Automatic' },
  { label: 'Worksheet creation',              manual: 'Photoshop or Word, 30+ min', tyoutor: 'Generated with answer key' },
  { label: 'Demo lesson with methodology',    manual: 'A weekend of prep',          tyoutor: '60 seconds, hiring-panel ready' },
  { label: 'Cost per month',                  manual: '~18 hours of your time',     tyoutor: '$12/month (free for 7 days)' },
  { label: 'Reusable across your classes',    manual: 'Rewrite from scratch',       tyoutor: 'Class Profiles auto-fill everything' },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_FAQ_JSON_LD) }} />
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
            <Link href="/auth/signup" className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            7 days free, then $12/month
          </h1>
          <p className="text-xl text-[#6B6860]">
            Full access from day one. No charge during trial. Cancel anytime.
          </p>
        </div>

        {/* Single plan card */}
        <div className="max-w-md mx-auto">
          <div className="bg-gradient-to-b from-teal-900/40 via-[#1E293B] to-[#1E293B] border border-teal-600/60 rounded-2xl p-8 shadow-xl shadow-teal-200/60 flex flex-col">
            <div className="flex justify-center mb-4">
              <span className="bg-teal-500 text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-widest uppercase">
                7-Day Free Trial
              </span>
            </div>
            <div className="mb-8">
              <div className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">Pro</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-extrabold text-white">$19</span>
                <span className="text-teal-300/70 text-lg">/month</span>
              </div>
              <p className="text-teal-300/60 text-sm">After 7-day free trial · No charge today</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-white/90">
                  <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  {f.text}
                </li>
              ))}
            </ul>

            <Link
              href="/auth/signup"
              className="block w-full text-center bg-teal-500 hover:bg-teal-400 text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-teal-600/25"
            >
              Start 7-Day Free Trial →
            </Link>
            <p className="text-teal-300/50 text-xs text-center mt-3">
              Card required. Cancel before day 7 — no charge.
            </p>
          </div>
        </div>

        {/* Feature breakdown */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-10">Everything included in your trial</h2>
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

        {/* Tyoutor Pro vs manual lesson planning */}
        <section className="mt-20" aria-labelledby="comparison-heading">
          <h2 id="comparison-heading" className="text-2xl font-bold text-center mb-3">Tyoutor Pro vs manual lesson planning</h2>
          <p className="text-sm text-[#6B6860] text-center mb-10 max-w-xl mx-auto">The honest cost comparison every ESL teacher should run before another Sunday-night planning session.</p>
          <div className="bg-white border border-[#E8E4DE] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F7F2]">
                <tr>
                  <th className="text-left px-5 py-4 font-bold text-[#4A473E]">What it takes</th>
                  <th className="text-left px-5 py-4 font-bold text-[#8C8880]">Manual planning</th>
                  <th className="text-left px-5 py-4 font-bold text-teal-700">Tyoutor Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(row => (
                  <tr key={row.label} className="border-t border-[#F0EEE9]">
                    <td className="px-5 py-4 font-semibold text-[#2D2D2D]">{row.label}</td>
                    <td className="px-5 py-4 text-[#6B6860]">{row.manual}</td>
                    <td className="px-5 py-4 text-[#2D6A4F] font-semibold">{row.tyoutor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-20 max-w-2xl mx-auto" aria-labelledby="pricing-faq-heading">
          <h2 id="pricing-faq-heading" className="text-2xl font-bold text-center mb-10">Pricing FAQ</h2>
          <div className="space-y-4">
            {PRICING_FAQS.map(faq => (
              <div key={faq.q} className="bg-white border border-[#E8E4DE] rounded-2xl p-5">
                <h3 className="font-semibold text-[#2D2D2D] mb-2 text-sm">{faq.q}</h3>
                <p className="text-sm text-[#6B6860] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <h2 className="text-2xl font-bold mb-4">Ready to reclaim your Sundays?</h2>
          <p className="text-[#6B6860] mb-6">7 days free. No charge today. Cancel before day 7 if it&#39;s not for you.</p>
          <Link href="/auth/signup" className="inline-block bg-teal-600 hover:bg-teal-500 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-teal-600/25">
            Start 7-Day Free Trial →
          </Link>
        </div>
      </main>
    </div>
  )
}
