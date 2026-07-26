import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { createAdminClient } from './admin'

/**
 * Fetch the caller's `public.users` row. If the row is missing (PGRST116 —
 * trigger failed, legacy account, race with signup), self-heal by upserting
 * from the auth session before returning.
 *
 * Callers should treat `error` as fatal and forward the message to the client:
 *
 *   const { profile, error } = await ensureProfile(supabase, session, 'subscription_status')
 *   if (error) return NextResponse.json({ error }, { status: 500 })
 */
export async function ensureProfile<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  session: Session,
  columns: string,
): Promise<{ profile: T | null; error: string | null }> {
  const userId = session.user.id

  const { data, error } = await supabase
    .from('users')
    .select(columns)
    .eq('id', userId)
    .single()

  if (data) return { profile: data as T, error: null }

  // PGRST116 = row not found. Anything else is a real DB error.
  if (error?.code !== 'PGRST116') {
    console.error('[ensureProfile] Lookup failed:', error)
    return { profile: null, error: 'Profile lookup failed. Please try again.' }
  }

  const admin = createAdminClient()
  const { data: created, error: createErr } = await admin
    .from('users')
    .upsert({
      id: userId,
      email: session.user.email ?? '',
      full_name: session.user.user_metadata?.full_name ?? '',
    }, { onConflict: 'id' })
    .select(columns)
    .single()

  if (createErr || !created) {
    console.error('[ensureProfile] Self-heal failed:', createErr)
    return { profile: null, error: 'Could not initialise your profile. Please contact support.' }
  }

  return { profile: created as T, error: null }
}
