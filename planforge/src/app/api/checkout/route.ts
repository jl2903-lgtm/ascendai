import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ensureProfile } from '@/lib/supabase/ensure-profile'
import { stripe } from '@/lib/stripe'

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
    }>(supabase, session, 'stripe_customer_id, full_name, subscription_status')

    if (profileErr || !profile) {
      return NextResponse.json({ error: profileErr ?? 'Profile not found' }, { status: 500 })
    }

    if (profile.subscription_status === 'pro' || profile.subscription_status === 'trialing') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 })
    }

    // Create or reuse Stripe customer
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: profile.full_name ?? undefined,
        metadata: { userId },
      })
      customerId = customer.id

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      payment_method_collection: 'always',
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'}/onboarding`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'}/trial-setup`,
      metadata: { userId },
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('[api/checkout]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
