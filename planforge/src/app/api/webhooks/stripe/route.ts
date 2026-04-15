import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

// Raw body required for Stripe signature verification
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
    console.error('[webhooks/stripe] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      // ── checkout.session.completed ─────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (!userId) {
          console.error('[webhooks/stripe] checkout.session.completed: missing userId in metadata')
          break
        }

        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'pro',
            subscription_tier: 'pro',
            subscription_id: subscriptionId,
            stripe_customer_id: customerId,
          })
          .eq('id', userId)

        if (error) {
          console.error('[webhooks/stripe] Failed to upgrade user:', error)
          break
        }

        console.log(`[webhooks/stripe] User ${userId} upgraded to Pro — sub: ${subscriptionId}`)
        break
      }

      // ── customer.subscription.deleted ──────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        const customerId = subscription.customer as string

        const resetFields = {
          subscription_status: 'cancelled' as const,
          subscription_tier: 'cancelled',
          subscription_id: null,
          lessons_used_this_month: 0,
          worksheets_used_this_month: 0,
          error_coach_used_this_month: 0,
          demo_lesson_used_this_month: 0,
          job_assistant_used_this_month: 0,
        }

        if (userId) {
          await supabase.from('users').update(resetFields).eq('id', userId)
          console.log(`[webhooks/stripe] User ${userId} subscription cancelled`)
        } else {
          // Fall back to customer ID lookup
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (!profile) {
            console.error('[webhooks/stripe] subscription.deleted: no user found for customer', customerId)
            break
          }
          await supabase.from('users').update(resetFields).eq('id', profile.id)
          console.log(`[webhooks/stripe] Customer ${customerId} subscription cancelled`)
        }
        break
      }

      // ── customer.subscription.updated ──────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        const customerId = subscription.customer as string
        const stripeStatus = subscription.status

        let internalStatus: 'pro' | 'cancelled' | 'free'
        if (stripeStatus === 'active' || stripeStatus === 'trialing') {
          internalStatus = 'pro'
        } else if (
          stripeStatus === 'canceled' ||
          stripeStatus === 'unpaid' ||
          stripeStatus === 'incomplete_expired'
        ) {
          internalStatus = 'cancelled'
        } else {
          // past_due / incomplete — don't lock out immediately
          console.log(`[webhooks/stripe] Subscription ${stripeStatus} — no action taken`)
          break
        }

        const updatePayload: Record<string, unknown> = {
          subscription_status: internalStatus,
          subscription_tier: internalStatus,
          subscription_id: internalStatus === 'cancelled' ? null : subscription.id,
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

        if (userId) {
          await supabase.from('users').update(updatePayload).eq('id', userId)
          console.log(`[webhooks/stripe] User ${userId} → ${internalStatus}`)
        } else {
          const { data: profile } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (!profile) {
            console.error('[webhooks/stripe] subscription.updated: no user for customer', customerId)
            break
          }
          await supabase.from('users').update(updatePayload).eq('id', profile.id)
          console.log(`[webhooks/stripe] Customer ${customerId} → ${internalStatus}`)
        }
        break
      }

      default:
        console.log(`[webhooks/stripe] Unhandled event: ${event.type}`)
    }
  } catch (error) {
    console.error('[webhooks/stripe] Handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
