import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { createAdminClient } from '@/lib/supabase/admin'

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

    let { data: profile, error: profileError } = await supabase
      .from('users')
      .select('stripe_customer_id, full_name')
      .eq('id', userId)
      .single()

    // Self-heal: profile row missing (trigger failed / legacy account) —
    // create it from the auth session so the user isn't trapped.
    if (profileError && profileError.code === 'PGRST116') {
      const admin = createAdminClient()
      const { data: created, error: createErr } = await admin
        .from('users')
        .upsert({
          id: userId,
          email: userEmail ?? '',
          full_name: session.user.user_metadata?.full_name ?? '',
        }, { onConflict: 'id' })
        .select('stripe_customer_id, full_name')
        .single()

      if (createErr || !created) {
        console.error('[create-checkout] Self-heal failed:', createErr)
        return NextResponse.json({ error: 'Could not initialise your profile. Please contact support.' }, { status: 500 })
      }
      profile = created
      profileError = null
    }

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
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'}/trial-setup?cancelled=1`,
      metadata: { userId },
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[create-checkout] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
