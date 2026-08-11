/**
 * Pulls a human-readable trace string out of an error-like value.
 *
 * Works whether the value is a real `Error` (has `.stack`) or a plain object
 * shaped like one — e.g. the output of {@link redactSecrets}, which turns an
 * `Error` into a plain object carrying the same `.stack`/`.message` fields —
 * since both are read the same way here.
 */
export function errorText(value: unknown): string {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (typeof v.stack === 'string') return v.stack
    if (typeof v.message === 'string') return v.message
  }
  return String(value)
}
