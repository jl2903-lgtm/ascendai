/**
 * Escape a string for safe insertion into HTML text or attribute content.
 * Use this whenever user-supplied text flows into an HTML string that will
 * be sent by email or rendered without React (React escapes automatically).
 */
export function escapeHtml(input: unknown): string {
  if (input == null) return ''
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
