'use client'

import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { CreditCard, Shield, Clock } from 'lucide-react'

export default function TrialSetupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStartTrial = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Could not create checkout session. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-dot-pattern" style={{ zIndex: -1 }} />
      <div className="blob-mint w-80 h-80 top-10 right-0 opacity-40" style={{ position: 'fixed', zIndex: -1 }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2">Complete your free trial setup</h1>
          <p className="text-[#6B6860] font-medium">
            You&#39;re one step away from full access. Enter your card to activate your 7-day free trial.
          </p>
        </div>

        <div className="bg-white border border-[#E8E4DE] rounded-2xl p-8 shadow-soft space-y-6">
          <div className="space-y-3">
            {[
              { icon: Clock, text: '7 days completely free — no charge today' },
              { icon: CreditCard, text: '$19/month after trial. Cancel anytime before day 7.' },
              { icon: Shield, text: 'Secure card capture via Stripe. We never store card details.' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-sm text-[#4A473E] font-medium">{text}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to secure checkout...
              </>
            ) : 'Activate my free trial →'}
          </button>

          <p className="text-xs text-[#8C8880] text-center font-medium">
            Payments secured by Stripe. You won&#39;t be charged during the trial.
          </p>
        </div>
      </div>
    </div>
  )
}
