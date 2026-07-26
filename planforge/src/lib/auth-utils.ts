/**
 * Constant-time string equality. Use this to compare any secret received from
 * a client (bearer tokens, API keys, admin passwords) against the expected
 * value. `===` leaks timing information proportional to how many leading
 * characters match, which is enough to recover a secret over enough requests.
 */
export function safeEq(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Check the `Authorization: Bearer <secret>` header against an env var.
 * Returns true only if the env var is set AND the header matches exactly.
 * Constant-time.
 */
export function checkBearerAuth(
  authHeader: string | null | undefined,
  expected: string | undefined,
): boolean {
  if (!expected) return false
  if (!authHeader?.startsWith('Bearer ')) return false
  return safeEq(authHeader.slice(7), expected)
}
