import { parseSize } from 'marzban-sdk'
import { z } from 'zod'

import { isDurationString, parseDurationMs } from './duration'

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters.')
  .max(32, 'Username must be at most 32 characters.')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, digits, and underscores.')

// Mirrors the shape parseSize actually understands — kept in sync deliberately
// so we reject up front what parseSize would otherwise silently coerce to 0
// (a typo like "10GBB" turning into "unlimited" is exactly the kind of
// silent-failure this schema exists to prevent).
const SIZE_PATTERN = /^\d+(?:[.,]\d+)?\s*(B|KB|KIB|MB|MIB|GB|GIB|TB|TIB|PB|PIB)?$/i

/** A human size ("10GB", "512 MB") or a raw non-negative byte count — transformed to bytes via the SDK's `parseSize`. */
export const sizeInputSchema = z
  .union([
    z.number().int().nonnegative(),
    z.string().regex(SIZE_PATTERN, 'Expected a size like "10GB", "512MB", or a raw byte count.'),
  ])
  .transform(value => (typeof value === 'number' ? value : parseSize(value)))

/** A relative duration ("30d", "12h", "45m", "90s"), transformed to milliseconds — for adding to an existing point in time, as opposed to `timestampInputSchema` below which resolves to an absolute instant. */
export const durationMsInputSchema = z
  .string()
  .refine(isDurationString, 'Expected a duration like "30d", "12h", "45m", or "90s".')
  .transform(value => parseDurationMs(value))

/**
 * A point in time, accepted in any of three shapes a model or human would
 * naturally reach for: a relative duration from now ("30d", "12h"), an
 * absolute ISO datetime, or a raw Unix-seconds timestamp. Always resolves to
 * Unix seconds — Marzban's own wire format for `expire` and friends.
 */
export const timestampInputSchema = z.union([z.string(), z.number().int().nonnegative()]).transform((value, ctx) => {
  if (typeof value === 'number') return value
  if (isDurationString(value)) return Math.floor((Date.now() + parseDurationMs(value)) / 1000)

  const asDate = new Date(value)
  if (Number.isNaN(asDate.getTime())) {
    ctx.addIssue({
      code: 'custom',
      message: `Expected a relative duration ("30d", "12h"), an ISO datetime, or a Unix timestamp — got "${value}".`,
    })
    return z.NEVER
  }
  return Math.floor(asDate.getTime() / 1000)
})
