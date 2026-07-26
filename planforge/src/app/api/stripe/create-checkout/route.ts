import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { ensureProfile } from '@/lib/supabase/ensure-profile'

import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email

    const { profile, error: profileErr } = await ensureProfile<{
      stripe_customer_id: string | null
      full_name: string | null
    }>(supabase, session, 'stripe_customer_id, full_name')

    if (profileErr || !profile) {
      return NextResponse.json({ error: profileErr ?? 'Profile not found' }, { status: 500 })
    }

    let customerId = profile.stripe_customer_id
    let allowTrial = true

    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId)
        if (existing.deleted) {
          customerId = null
        } else {
          // Prevent trial farming: if this customer has any prior subscription
          // (cancelled / paid), skip the free 7-day trial on this checkout.
          const priorSubs = await stripe.subscriptions.list({
            customer: customerId,
            limit: 1,
            status: 'all',
          })
          if (priorSubs.data.length > 0) allowTrial = false
        }
      } catch { customerId = null }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: profile.full_name ?? undefined,
        metadata: { userId },
      })

      customerId = customer.id

      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (updateError) {
        console.error('[create-checkout] Failed to save stripe_customer_id:', updateError)
        // Non-fatal — proceed with checkout anyway
      }
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
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'}/trial-setup?cancelled=1`,
      metadata: { userId },
      subscription_data: {
        ...(allowTrial ? { trial_period_days: 7 } : {}),
        metadata: { userId },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 })
  } catch (error) {
    // Log full Stripe error server-side (has price-id / secret hints we do
    // NOT want to hand to the client). Return a generic message.
    console.error('[create-checkout] Error:', error)
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 })
  }
}
