import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'

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

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('stripe_customer_id, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id

    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId)
        if (existing.deleted) customerId = null
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
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'}/trial-setup`,
      metadata: { userId },
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 })
  } catch (error) {
    console.error('[create-checkout] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
