// Users who signed up before this date use the old 5-free-generations system.
// Users who signed up on or after this date use the 7-day trial + Stripe checkout system.
export const FREE_TRIAL_CUTOFF = new Date('2026-04-24T00:00:00Z')

// Null-safe legacy check. `new Date(null)` returns the Unix epoch, which is
// always before the cutoff — so callers who pass a null created_at without
// this guard would incorrectly treat unknown users as legacy and skip the
// trial gate. Always route through this helper.
export function isLegacyUser(createdAt: string | null | undefined): boolean {
  return !!createdAt && new Date(createdAt) < FREE_TRIAL_CUTOFF
}
