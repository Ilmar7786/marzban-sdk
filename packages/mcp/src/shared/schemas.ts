import {
  parseSize,
  type SubscriptionUserResponse,
  subscriptionUserResponseSchema,
  type UserResponse,
  userResponseSchema,
} from 'marzban-sdk'
import { z } from 'zod'

import { isDurationString, parseDurationMs } from './duration'

/** Shared by every `destructive`-scope tool — see `core/confirm`. Never present on the first call; the tool describes what would happen and mints one for the model to echo back once the user has explicitly agreed. */
export const confirmTokenSchema = z
  .string()
  .optional()
  .describe(
    'Omit on the first call. The tool will describe the consequences and return a token here — pass it back in a repeated call, but only after the user has explicitly confirmed.'
  )

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

// --- output-side: SDK response schemas made wire-honest ------------------

/**
 * `UserResponse`/`SubscriptionUserResponse`'s four datetime fields, as the
 * MCP layer should declare them in an `outputSchema` — plain `z.string()`,
 * deliberately NOT the SDK's `z.iso.datetime({ local: true })`.
 *
 * `local: true` is the *correct* choice on the SDK side (`kubb.config.ts`):
 * Marzban returns these fields without a UTC offset —
 * `created_at: "2026-09-02T14:00:57.764445"`, no `Z`, no `+00:00` — and the
 * SDK has to parse that. But converting `z.iso.datetime({ local: true })` to
 * JSON Schema still emits `format: "date-time"` (RFC 3339, offset required)
 * alongside a `pattern` that *does* allow the missing offset — and a strict
 * client validates `structuredContent` against `format`, not `pattern`. It
 * rejects Marzban's real response even though the call succeeded
 * (github.com/Ilmar7786/marzban-sdk#112). Plain `z.string()` makes no format
 * claim the wire format can't back up.
 *
 * Never reuse an SDK response schema wholesale as an MCP `outputSchema`
 * without overriding these — see `mcpUserResponseSchema`/
 * `mcpSubscriptionUserResponseSchema` below, and the "no `format` keyword in
 * any outputSchema" invariant in `output-schema-regression.test.ts`.
 */
const WIRE_DATETIME_FIELDS = {
  created_at: z.string(),
  sub_updated_at: z.string().nullable().optional(),
  online_at: z.string().nullable().optional(),
  on_hold_timeout: z.string().nullable().optional(),
}

// kubb types these exports as opaque `z.ZodType<X>` (see e.g.
// packages/sdk/src/gen/schemas/userResponseSchema.ts) even though they're
// `ZodObject`s at runtime — the cast below is what makes `.extend()`
// reachable. Every other field (present now or added later) is inherited
// from the SDK schema unchanged; only the four above are overridden.
export const mcpUserResponseSchema = (userResponseSchema as unknown as z.ZodObject<z.ZodRawShape>).extend(
  WIRE_DATETIME_FIELDS
) as unknown as z.ZodType<UserResponse>

export const mcpSubscriptionUserResponseSchema = (
  subscriptionUserResponseSchema as unknown as z.ZodObject<z.ZodRawShape>
).extend(WIRE_DATETIME_FIELDS) as unknown as z.ZodType<SubscriptionUserResponse>
