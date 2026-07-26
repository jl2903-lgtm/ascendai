import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ensureProfile } from '@/lib/supabase/ensure-profile'
import { stripe } from '@/lib/stripe'
import { isLegacyUser } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email

    const { profile, error: profileErr } = await ensureProfile<{
      stripe_customer_id: string | null
      full_name: string | null
      subscription_status: string
      created_at: string | null
    }>(supabase, session, 'stripe_customer_id, full_name, subscription_status, created_at')

    if (profileErr || !profile) {
      return NextResponse.json({ error: profileErr ?? 'Profile not found' }, { status: 500 })
    }

    if (profile.subscription_status === 'pro' || profile.subscription_status === 'trialing') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 })
    }

    const legacy = isLegacyUser(profile.created_at)

    let customerId = profile.stripe_customer_id
    let allowTrial = !legacy // legacy users never get the trial

    // Verify the stored customer still exists in Stripe — it may have been
    // deleted or belong to a different Stripe environment (test vs live).
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId)
        if (existing.deleted) {
          customerId = null
        } else if (allowTrial) {
          // Prevent trial farming: cancellers who come back don't get another trial.
          const priorSubs = await stripe.subscriptions.list({
            customer: customerId,
            limit: 1,
            status: 'all',
          })
          if (priorSubs.data.length > 0) allowTrial = false
        }
      } catch {
        customerId = null
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: profile.full_name ?? undefined,
        metadata: { userId },
      })
      customerId = customer.id
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      payment_method_collection: 'always',
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
      success_url: `${BASE}/onboarding`,
      cancel_url: legacy ? `${BASE}/pricing` : `${BASE}/trial-setup`,
      metadata: { userId },
      subscription_data: {
        ...(allowTrial ? { trial_period_days: 7 } : {}),
        metadata: { userId },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 })
  } catch (error) {
    // Full error to logs, generic message to client.
    console.error('[stripe/upgrade] Error:', error)
    return NextResponse.json({ error: 'Could not start upgrade. Please try again.' }, { status: 500 })
  }
}
