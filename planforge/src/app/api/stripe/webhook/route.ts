import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

import type Stripe from 'stripe'

// Required for reading the raw body to verify the Stripe signature
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (!userId) {
          console.error('[webhook] checkout.session.completed: missing userId in metadata')
          break
        }

        // Fetch subscription to get trial_end date
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'trialing',
            subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            trial_end: trialEnd,
          })
          .eq('id', userId)

        if (updateError) {
          console.error('[webhook] Failed to update profile after checkout:', updateError)
          break
        }

        console.log(`[webhook] User ${userId} started trial. Sub: ${subscriptionId}, trial_end: ${trialEnd}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const userId = subscription.metadata?.userId

        const resetFields = {
          subscription_status: 'cancelled' as const,
          subscription_id: null,
          trial_end: null,
          error_coach_used_this_month: 0,
          demo_lesson_used_this_month: 0,
          job_assistant_used_this_month: 0,
        }

        if (!userId) {
          const customerId = subscription.customer as string
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (!profile) {
            console.error('[webhook] customer.subscription.deleted: could not find user for customer', customerId)
            break
          }

          await supabase.from('users').update(resetFields).eq('id', profile.id)
          console.log(`[webhook] Subscription cancelled for customer ${customerId}`)
          break
        }

        await supabase.from('users').update(resetFields).eq('id', userId)
        console.log(`[webhook] User ${userId} subscription cancelled`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const userId = subscription.metadata?.userId
        const stripeStatus = subscription.status

        let internalStatus: 'trialing' | 'pro' | 'cancelled'
        if (stripeStatus === 'trialing') {
          internalStatus = 'trialing'
        } else if (stripeStatus === 'active') {
          internalStatus = 'pro'
        } else if (stripeStatus === 'canceled' || stripeStatus === 'unpaid' || stripeStatus === 'incomplete_expired') {
          internalStatus = 'cancelled'
        } else {
          // past_due, incomplete — keep as-is; don't lock out immediately
          console.log(`[webhook] Subscription status changed to ${stripeStatus} — no action taken`)
          break
        }

        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        const updatePayload: Record<string, unknown> = {
          subscription_status: internalStatus,
          subscription_id: internalStatus === 'cancelled' ? null : subscription.id,
          trial_end: internalStatus === 'pro' ? null : trialEnd,
        }

        if (internalStatus === 'cancelled') {
          Object.assign(updatePayload, {
            lessons_used_this_month: 0,
            worksheets_used_this_month: 0,
            error_coach_used_this_month: 0,
            demo_lesson_used_this_month: 0,
            job_assistant_used_this_month: 0,
          })
        }

        if (!userId) {
          const customerId = subscription.customer as string
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (!profile) {
            console.error('[webhook] customer.subscription.updated: could not find user for customer', customerId)
            break
          }

          await supabase.from('users').update(updatePayload).eq('id', profile.id)
          console.log(`[webhook] Updated subscription status to ${internalStatus} for customer ${customerId}`)
          break
        }

        await supabase.from('users').update(updatePayload).eq('id', userId)
        console.log(`[webhook] User ${userId} subscription updated to ${internalStatus}`)
        break
      }

      default:
        // Ignore unhandled event types
        console.log(`[webhook] Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('[webhook] Handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
