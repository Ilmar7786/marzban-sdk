import type { UserResponse } from '../../../src/index'

/**
 * Extracts the opaque `/sub/{token}` path segment from a user's
 * `subscription_url`. `subscription_url` is stable for the lifetime of the
 * user — reads don't change it, and neither does `revokeUserSubscription`
 * (docs/marzban-quirks.md) — so it's safe to read once here and reuse.
 */
export function extractSubscriptionToken(user: UserResponse): string {
  const match = user.subscription_url.match(/\/sub\/([^/]+)/)
  if (!match) throw new Error(`unexpected subscription_url shape: ${user.subscription_url}`)
  return match[1]!
}
