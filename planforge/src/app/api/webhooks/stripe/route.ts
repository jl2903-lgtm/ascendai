import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

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

  // Idempotency: Stripe retries any 2xx-timeout delivery. Without this,
  // welcome emails, GHL contacts and account creation all double-fire.
  const { error: dedupErr } = await supabase
    .from('stripe_events')
    .insert({ id: event.id })
  if (dedupErr && dedupErr.code === '23505') {
    console.log(`[webhooks/stripe] Skipping already-processed event ${event.id}`)
    return NextResponse.json({ received: true, deduped: true }, { status: 200 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        let userId = session.metadata?.userId
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string
        let autoCreated = false

        if (!userId) {
          // Payment Link: userId not in metadata — resolve via customer email
          const email = session.customer_details?.email
          if (email) {
            // Tier 1: public.users lookup
            const { data: profileByEmail } = await supabase
              .from('users')
              .select('id')
              .eq('email', email)
              .single()

            if (profileByEmail) {
              userId = profileByEmail.id
            } else {
              // Tier 2: auth.users lookup
              const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
              const authUser = authData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
              if (authUser) userId = authUser.id
            }

            // Tier 3: auto-create account — user paid via Payment Link with no prior account
            if (!userId) {
              const tempPassword = crypto.randomUUID() + '!Aa1'
              const customerName = session.customer_details?.name || ''
              const nameParts = customerName.trim().split(' ')

              const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                  full_name: customerName,
                  source: 'stripe_payment_link',
                },
              })

              if (newUser?.user) {
                userId = newUser.user.id

                // Trigger on_auth_user_created already inserted the public.users row;
                // update it with the name (trigger may have gotten it from metadata already,
                // but be explicit to be safe).
                await supabase.from('users').update({
                  full_name: customerName,
                  stripe_customer_id: customerId,
                }).eq('id', userId)

                // Send password-reset link so they can set their own password
                await supabase.auth.admin.generateLink({ type: 'recovery', email })

                // Welcome email via Resend
                fetch(
                  new URL('/api/send-welcome-email', process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io').toString(),
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-api-key': process.env.INTERNAL_API_SECRET ?? '',
                    },
                    // skipGhl: Tier-3 auto-create already fired GHL below,
                    // don't duplicate the contact.
                    body: JSON.stringify({ email, name: customerName, skipGhl: true }),
                  }
                ).catch(e => console.error('[webhooks/stripe] Welcome email failed for auto-created user:', e))

                // GHL webhook
                if (process.env.GHL_WEBHOOK_URL) {
                  fetch(process.env.GHL_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      first_name: nameParts[0] || 'there',
                      last_name: nameParts.slice(1).join(' ') || '',
                      full_name: customerName,
                      email,
                      source: 'Tyoutor Pro - Payment Link Signup',
                      tags: ['tyoutor-pro-signup', 'payment-link-user'],
                    }),
                  }).catch(() => {})
                }

                autoCreated = true
                console.log('[webhooks/stripe] Auto-created Supabase account for payment link user:', email)
              } else {
                console.error('[webhooks/stripe] Failed to auto-create user for payment link:', createError)
              }
            }
          }

          if (!userId) {
            console.error('[webhooks/stripe] checkout.session.completed: could not resolve userId from email', session.customer_details?.email)
            break
          }
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'trialing',
            subscription_tier: 'trialing',
            subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            trial_end: trialEnd,
          })
          .eq('id', userId)

        if (error) {
          console.error('[webhooks/stripe] Failed to start trial for user:', error)
          break
        }

        console.log(`[webhooks/stripe] User ${userId} started trial — sub: ${subscriptionId}, trial_end: ${trialEnd}`)

        if (!autoCreated) {
          const customerEmail = session.customer_details?.email
          const customerName = session.customer_details?.name || ''
          if (customerEmail) {
            fetch(
              new URL('/api/send-welcome-email', process.env.NEXT_PUBLIC_APP_URL || 'https://tyoutorpro.io').toString(),
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': process.env.INTERNAL_API_SECRET ?? '',
                },
                body: JSON.stringify({ email: customerEmail, name: customerName }),
              }
            ).catch(e => console.error('[webhooks/stripe] Welcome email failed:', e))
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        const customerId = subscription.customer as string

        const resetFields = {
          subscription_status: 'cancelled' as const,
          subscription_tier: 'cancelled',
          subscription_id: null,
          trial_end: null,
          error_coach_used_this_month: 0,
          demo_lesson_used_this_month: 0,
          job_assistant_used_this_month: 0,
        }

        if (userId) {
          await supabase.from('users').update(resetFields).eq('id', userId)
          console.log(`[webhooks/stripe] User ${userId} subscription cancelled`)
          break
        }

        const { data: profileByCustomer } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profileByCustomer) {
          await supabase.from('users').update(resetFields).eq('id', profileByCustomer.id)
          console.log(`[webhooks/stripe] Customer ${customerId} subscription cancelled`)
          break
        }

        // Final fallback: resolve user by Stripe customer email
        const customer = await stripe.customers.retrieve(customerId)
        if (!customer.deleted && customer.email) {
          const { data: profileByEmail } = await supabase
            .from('users')
            .select('id')
            .eq('email', customer.email)
            .single()

          if (profileByEmail) {
            await supabase.from('users').update(resetFields).eq('id', profileByEmail.id)
            console.log(`[webhooks/stripe] Customer ${customerId} (email ${customer.email}) subscription cancelled`)
            break
          }
        }

        console.error('[webhooks/stripe] subscription.deleted: could not resolve user for customer', customerId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        const customerId = subscription.customer as string
        const stripeStatus = subscription.status

        let internalStatus: 'trialing' | 'pro' | 'cancelled'
        if (stripeStatus === 'trialing') {
          internalStatus = 'trialing'
        } else if (stripeStatus === 'active') {
          internalStatus = 'pro'
        } else if (
          stripeStatus === 'canceled' ||
          stripeStatus === 'unpaid' ||
          stripeStatus === 'incomplete_expired'
        ) {
          internalStatus = 'cancelled'
        } else {
          console.log(`[webhooks/stripe] Subscription ${stripeStatus} — no action taken`)
          break
        }

        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null

        const updatePayload: Record<string, unknown> = {
          subscription_status: internalStatus,
          subscription_tier: internalStatus,
          subscription_id: internalStatus === 'cancelled' ? null : subscription.id,
          trial_end: internalStatus === 'pro' ? null : trialEnd,
        }

        if (internalStatus === 'cancelled') {
          Object.assign(updatePayload, {
            error_coach_used_this_month: 0,
            demo_lesson_used_this_month: 0,
            job_assistant_used_this_month: 0,
          })
        }

        if (userId) {
          await supabase.from('users').update(updatePayload).eq('id', userId)
          console.log(`[webhooks/stripe] User ${userId} → ${internalStatus}`)
          break
        }

        const { data: profileByCustomer } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profileByCustomer) {
          await supabase.from('users').update(updatePayload).eq('id', profileByCustomer.id)
          console.log(`[webhooks/stripe] Customer ${customerId} → ${internalStatus}`)
          break
        }

        // Final fallback: resolve user by Stripe customer email
        const customer = await stripe.customers.retrieve(customerId)
        if (!customer.deleted && customer.email) {
          const { data: profileByEmail } = await supabase
            .from('users')
            .select('id')
            .eq('email', customer.email)
            .single()

          if (profileByEmail) {
            await supabase.from('users').update(updatePayload).eq('id', profileByEmail.id)
            console.log(`[webhooks/stripe] Customer ${customerId} (email ${customer.email}) → ${internalStatus}`)
            break
          }
        }

        console.error('[webhooks/stripe] subscription.updated: could not resolve user for customer', customerId)
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
