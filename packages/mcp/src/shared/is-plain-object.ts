/** A non-null, non-array object — the shape of a parsed JSON object. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
