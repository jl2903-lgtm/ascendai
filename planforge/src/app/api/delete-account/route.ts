import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route-handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function POST(_req: NextRequest) {
  try {
    const supabase = createRouteClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Look up any Stripe references we need to clean up. Use the caller's
    // session (RLS-scoped) so we can only ever act on our own row.
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_id')
      .eq('id', userId)
      .single()

    // Cancel the active subscription first — end-of-billing-period cancel so
    // if we fail mid-way the user isn't charged for time they can't use.
    if (profile?.subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.subscription_id)
      } catch (err) {
        // 404 (already cancelled) is fine; log and continue.
        console.warn('[delete-account] Stripe subscription cancel:', err)
      }
    }

    // Delete the auth user via admin. The FK from public.users(id) → auth.users
    // has ON DELETE CASCADE (migration 001) so the profile row + all owned
    // lessons/worksheets/classes/etc. tear down with it.
    const admin = createAdminClient()
    const { error: authDelErr } = await admin.auth.admin.deleteUser(userId)
    if (authDelErr) {
      console.error('[delete-account] auth.admin.deleteUser failed:', authDelErr)
      return NextResponse.json({ error: 'Could not delete account. Please contact support.' }, { status: 500 })
    }

    // Sign the current session out — client redirects to landing page.
    await supabase.auth.signOut()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[delete-account] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
