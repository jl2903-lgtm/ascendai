'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { CreditCard, Shield, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type PageState = 'loading' | 'redirecting' | 'cancelled' | 'polling' | 'error'

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'info@tyoutorpro.io'

const FEATURES = [
  { icon: Clock, text: '7 days completely free — no charge today' },
  { icon: CreditCard, text: '$12/month after trial. Cancel anytime before day 7.' },
  { icon: Shield, text: 'Secure card capture via Stripe. We never store card details.' },
]

export default function TrialSetupPage() {
  const router = useRouter()
  const [state, setState] = useState<PageState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const pollingRef = useRef(false)

  const startCheckout = async () => {
    setState('redirecting')
    try {
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setErrorMsg(data.error ?? 'Could not start checkout. Please try again.')
        setState('error')
      }
    } catch {
      setErrorMsg('Connection error. Please check your internet and try again.')
      setState('error')
    }
  }

  // Poll Supabase until subscription_status is active (webhook fired) or timeout
  const pollForActivation = async (userId: string) => {
    pollingRef.current = true
    setState('polling')
    const supabase = createClient()
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 2500))
      if (!pollingRef.current) return // unmounted
      const { data } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', userId)
        .single()
      if (data?.subscription_status === 'trialing' || data?.subscription_status === 'pro') {
        router.push('/dashboard')
        return
      }
    }
    // 15s elapsed, webhook still hasn't fired — show a recoverable error
    setErrorMsg(
      'Your payment was received but your account is still being activated. ' +
      'Please wait a moment and refresh, or contact support if this persists.'
    )
    setState('error')
  }

  useEffect(() => {
    const cancelled = new URLSearchParams(window.location.search).get('cancelled') === '1'
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('subscription_status, stripe_customer_id')
        .eq('id', session.user.id)
        .single()

      // Already active — skip to dashboard
      if (profile?.subscription_status === 'trialing' || profile?.subscription_status === 'pro') {
        router.push('/dashboard')
        return
      }

      // User came back after cancelling Stripe — show the page, don't auto-trigger
      if (cancelled) {
        setState('cancelled')
        return
      }

      // User has a stripe_customer_id but no subscription yet — they already went through
      // Stripe at some point. The webhook may be delayed. Poll before starting a new checkout.
      if (profile?.stripe_customer_id) {
        pollForActivation(session.user.id)
        return
      }

      // Fresh user — auto-initiate checkout
      startCheckout()
    })

    return () => { pollingRef.current = false }
  }, [])

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
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-sm text-[#4A473E] font-medium">{text}</p>
              </div>
            ))}
          </div>

          {/* Loading / auto-redirecting */}
          {(state === 'loading' || state === 'redirecting') && (
            <div className="flex items-center justify-center gap-3 py-2">
              <svg className="animate-spin h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-[#4A473E] font-medium text-sm">
                {state === 'loading' ? 'Loading…' : 'Redirecting to secure checkout…'}
              </span>
            </div>
          )}

          {/* Polling — waiting for webhook after payment */}
          {state === 'polling' && (
            <div className="flex items-center justify-center gap-3 py-2">
              <svg className="animate-spin h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-[#4A473E] font-medium text-sm">Activating your account…</span>
            </div>
          )}

          {/* User cancelled Stripe — show button, no auto-redirect */}
          {state === 'cancelled' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm font-medium">
                No problem — you can complete your trial setup whenever you&#39;re ready. No commitment until after day 7.
              </div>
              <button
                onClick={startCheckout}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              >
                Activate my free trial →
              </button>
            </div>
          )}

          {/* Error state */}
          {state === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
                {errorMsg}
              </div>
              <button
                onClick={startCheckout}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              >
                Try again →
              </button>
              <p className="text-xs text-[#8C8880] text-center font-medium">
                Still having trouble?{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-teal-600 hover:text-teal-500 underline">
                  Contact support
                </a>
              </p>
            </div>
          )}

          <p className="text-xs text-[#8C8880] text-center font-medium">
            Payments secured by Stripe. You won&#39;t be charged during the trial.
          </p>
        </div>
      </div>
    </div>
  )
}
