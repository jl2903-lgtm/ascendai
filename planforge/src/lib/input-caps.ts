/**
 * Coerce an unknown value to a bounded string. Non-string types come back as
 * empty string. Anything above `max` chars is truncated at the boundary so
 * a caller can't blow the OpenAI token budget by pasting megabytes.
 */
export function boundedString(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.length > max ? value.slice(0, max) : value
}

/**
 * Return `value` if it's a positive integer in [min, max], otherwise `fallback`.
 * Guards against a client sending `questionCount: 100000` and having it flow
 * verbatim into an LLM prompt.
 */
export function boundedInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (!Number.isFinite(n) || n < min || n > max) return fallback
  return Math.floor(n)
}

/**
 * Validate `value` is an array of strings, each bounded by `maxElement`, and
 * capped at `maxItems` elements. Non-array or non-string entries produce [].
 */
export function boundedStringArray(value: unknown, maxItems: number, maxElement: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is string => typeof v === 'string')
    .slice(0, maxItems)
    .map(s => (s.length > maxElement ? s.slice(0, maxElement) : s))
}
