import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { stripe } from '@/lib/stripe'
import { FREE_TRIAL_CUTOFF } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('stripe_customer_id, full_name, subscription_status, created_at')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.subscription_status === 'pro' || profile.subscription_status === 'trialing') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 })
    }

    const isLegacyUser = new Date(profile.created_at) < FREE_TRIAL_CUTOFF

    let customerId = profile.stripe_customer_id
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
      cancel_url: isLegacyUser ? `${BASE}/pricing` : `${BASE}/trial-setup`,
      metadata: { userId },
      subscription_data: {
        ...(isLegacyUser ? {} : { trial_period_days: 7 }),
        metadata: { userId },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 })
  } catch (error) {
    console.error('[stripe/upgrade] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
