/**
 * One-time script: sync all existing Supabase users to GoHighLevel as contacts.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GHL_WEBHOOK_URL=... npm run sync-ghl
 *
 * Or with a .env.local file loaded via dotenv:
 *   npx dotenv -e .env.local -- npx tsx scripts/sync-users-to-ghl.ts
 */

import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL

const DELAY_MS = 500      // pause between each GHL request
const COUNTDOWN_SECS = 5  // warning countdown before starting

// ── Validation ────────────────────────────────────────────────────────────────

if (!SUPABASE_URL) {
  console.error('ERROR: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is not set.')
  process.exit(1)
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not set.')
  process.exit(1)
}
if (!GHL_WEBHOOK_URL) {
  console.error('ERROR: GHL_WEBHOOK_URL is not set.')
  process.exit(1)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function splitName(fullName: string | null): { firstName: string; lastName: string } {
  const parts = (fullName || '').trim().split(' ')
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  }
}

async function countdown(seconds: number) {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\rStarting in ${i}s... (Ctrl+C to cancel)  `)
    await sleep(1000)
  }
  process.stdout.write('\r                                          \r')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Fetch all users
  console.log('Fetching users from Supabase...')
  const { data: users, error } = await supabase
    .from('users')
    .select('email, full_name, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('ERROR: Failed to fetch users from Supabase:', error.message)
    process.exit(1)
  }

  if (!users || users.length === 0) {
    console.log('No users found. Nothing to sync.')
    return
  }

  const total = users.length

  console.log(`\nThis will sync ${total} users to GHL.`)
  console.log('Press Ctrl+C to cancel.')
  await countdown(COUNTDOWN_SECS)
  console.log(`Starting sync of ${total} users...\n`)

  let synced = 0
  let failed = 0

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const email = user.email
    const { firstName, lastName } = splitName(user.full_name)
    const index = i + 1

    try {
      const res = await fetch(GHL_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          name: user.full_name || '',
          email,
          source: 'Tyoutor Pro - Existing User Sync',
          tags: ['tyoutor-pro-signup', 'existing-user'],
        }),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => res.statusText)
        throw new Error(`HTTP ${res.status}: ${body}`)
      }

      synced++
      console.log(`Synced: ${email} (${index} of ${total})`)
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`FAILED: ${email} — ${msg}`)
    }

    // Delay between requests (skip after the last one)
    if (i < users.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  console.log(`\nDone. ${synced} synced, ${failed} failed out of ${total} total.`)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
