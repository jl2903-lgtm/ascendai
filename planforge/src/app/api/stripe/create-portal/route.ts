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

    const { profile, error: profileErr } = await ensureProfile<{
      stripe_customer_id: string | null
    }>(supabase, session, 'stripe_customer_id')

    if (profileErr || !profile) {
      return NextResponse.json({ error: profileErr ?? 'Profile not found' }, { status: 500 })
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe first.' },
        { status: 400 }
      )
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io'}/dashboard/settings`,
    })

    return NextResponse.json({ url: portalSession.url }, { status: 200 })
  } catch (error) {
    console.error('[create-portal] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
