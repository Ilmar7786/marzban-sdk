import type { UserResponse } from 'marzban-sdk'

export interface UserSummary {
  dataLeftBytes: number | null
  usagePercent: number | null
  daysLeft: number | null
  isExpired: boolean
}

// Local analog of the SDK's proposed `summarizeUser` helper (plan §2, P5) —
// not exported from marzban-sdk today, so this stays MCP-local until/unless
// that lands and this can be deleted in favor of it.
export function summarizeUser(user: UserResponse, now: number = Date.now()): UserSummary {
  const hasDataLimit = typeof user.data_limit === 'number' && user.data_limit > 0
  const dataLeftBytes = hasDataLimit ? Math.max(0, user.data_limit! - user.used_traffic) : null
  const usagePercent = hasDataLimit ? Math.min(100, (user.used_traffic / user.data_limit!) * 100) : null

  const hasExpire = typeof user.expire === 'number' && user.expire > 0
  const daysLeft = hasExpire ? Math.max(0, Math.ceil((user.expire! * 1000 - now) / 86_400_000)) : null

  const isExpired = user.status === 'expired' || (hasExpire && user.expire! * 1000 <= now)

  return { dataLeftBytes, usagePercent, daysLeft, isExpired }
}

export interface RenewalPatch {
  expire?: number
  data_limit?: number
  status?: 'active'
}

export interface RenewalInput {
  addDurationMs?: number
  addDataBytes?: number
}

/**
 * Local analog of the SDK's proposed `buildRenewalPatch` helper (plan §2,
 * P6). Renewing isn't a single-field change: an `expired`/`limited` user
 * needs `status` moved back to `active` too — those two statuses are
 * server-assigned and not in `UserStatusModify`, so `active` is the only
 * value this can safely set.
 */
export function buildRenewalPatch(user: UserResponse, input: RenewalInput, now: number = Date.now()): RenewalPatch {
  const patch: RenewalPatch = {}

  if (input.addDurationMs !== undefined) {
    // An unlimited (0/null) or already-past expire has no meaningful
    // "current end date" to extend from — anchor to now instead of
    // silently no-op-ing or extending from a moment already in the past.
    const currentExpireMs = typeof user.expire === 'number' && user.expire > 0 ? user.expire * 1000 : null
    const base = currentExpireMs !== null && currentExpireMs > now ? currentExpireMs : now
    patch.expire = Math.floor((base + input.addDurationMs) / 1000)
  }

  if (input.addDataBytes !== undefined) {
    const currentLimit = user.data_limit ?? 0
    // Unlimited (0) stays unlimited — "add more data" to someone who
    // already has no cap isn't a meaningful operation to perform silently.
    patch.data_limit = currentLimit > 0 ? currentLimit + input.addDataBytes : 0
  }

  if (user.status === 'expired' || user.status === 'limited') {
    patch.status = 'active'
  }

  return patch
}
