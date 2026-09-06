import type { UserResponse } from 'marzban-sdk'
import { describe, expect, it } from 'vitest'

import { buildRenewalPatch, summarizeUser } from './users.helpers'

const NOW = new Date('2026-08-13T00:00:00Z').getTime()

function makeUser(overrides: Partial<UserResponse> = {}): UserResponse {
  return {
    proxies: {},
    username: 'alice',
    status: 'active',
    used_traffic: 0,
    created_at: '2026-01-01T00:00:00', // Marzban's real wire format — no offset, see #112
    ...overrides,
  }
}

describe('summarizeUser', () => {
  it('returns null data fields for an unlimited user', () => {
    const summary = summarizeUser(makeUser({ data_limit: 0 }), NOW)
    expect(summary.dataLeftBytes).toBeNull()
    expect(summary.usagePercent).toBeNull()
  })

  it('computes data left and usage percent for a limited user', () => {
    const summary = summarizeUser(makeUser({ data_limit: 1000, used_traffic: 250 }), NOW)
    expect(summary.dataLeftBytes).toBe(750)
    expect(summary.usagePercent).toBe(25)
  })

  it('clamps usage percent at 100 when used_traffic exceeds the limit', () => {
    const summary = summarizeUser(makeUser({ data_limit: 1000, used_traffic: 1500 }), NOW)
    expect(summary.usagePercent).toBe(100)
    expect(summary.dataLeftBytes).toBe(0)
  })

  it('returns null daysLeft for a user with no expiration', () => {
    const summary = summarizeUser(makeUser({ expire: 0 }), NOW)
    expect(summary.daysLeft).toBeNull()
  })

  it('computes daysLeft for a future expiration, rounding up', () => {
    const expire = Math.floor(NOW / 1000) + 2.5 * 86_400
    const summary = summarizeUser(makeUser({ expire }), NOW)
    expect(summary.daysLeft).toBe(3)
  })

  it('clamps daysLeft at 0 for a past expiration instead of going negative', () => {
    const expire = Math.floor(NOW / 1000) - 86_400
    const summary = summarizeUser(makeUser({ expire, status: 'expired' }), NOW)
    expect(summary.daysLeft).toBe(0)
  })

  it('reports isExpired true when status is expired', () => {
    expect(summarizeUser(makeUser({ status: 'expired' }), NOW).isExpired).toBe(true)
  })

  it('reports isExpired true when expire is in the past even if status has not caught up yet', () => {
    const expire = Math.floor(NOW / 1000) - 60
    expect(summarizeUser(makeUser({ status: 'active', expire }), NOW).isExpired).toBe(true)
  })

  it('reports isExpired false for an active user with a future expiration', () => {
    const expire = Math.floor(NOW / 1000) + 86_400
    expect(summarizeUser(makeUser({ status: 'active', expire }), NOW).isExpired).toBe(false)
  })
})

describe('buildRenewalPatch', () => {
  it('extends a future expire from its current end date, not from now', () => {
    const futureExpire = Math.floor(NOW / 1000) + 10 * 86_400
    const patch = buildRenewalPatch(makeUser({ expire: futureExpire }), { addDurationMs: 30 * 86_400_000 }, NOW)
    expect(patch.expire).toBe(futureExpire + 30 * 86_400)
  })

  it('extends an unlimited (0) expire from now, not from an impossible base', () => {
    const patch = buildRenewalPatch(makeUser({ expire: 0 }), { addDurationMs: 30 * 86_400_000 }, NOW)
    expect(patch.expire).toBe(Math.floor(NOW / 1000) + 30 * 86_400)
  })

  it('extends a past expire from now, not from the past', () => {
    const pastExpire = Math.floor(NOW / 1000) - 30 * 86_400
    const patch = buildRenewalPatch(
      makeUser({ expire: pastExpire, status: 'expired' }),
      { addDurationMs: 30 * 86_400_000 },
      NOW
    )
    expect(patch.expire).toBe(Math.floor(NOW / 1000) + 30 * 86_400)
  })

  it('omits expire from the patch when addDurationMs is not requested', () => {
    const patch = buildRenewalPatch(makeUser(), { addDataBytes: 1000 }, NOW)
    expect(patch.expire).toBeUndefined()
  })

  it('adds to an existing positive data_limit', () => {
    const patch = buildRenewalPatch(makeUser({ data_limit: 1000 }), { addDataBytes: 500 }, NOW)
    expect(patch.data_limit).toBe(1500)
  })

  it('keeps an unlimited (0) data_limit unlimited when adding data', () => {
    const patch = buildRenewalPatch(makeUser({ data_limit: 0 }), { addDataBytes: 500 }, NOW)
    expect(patch.data_limit).toBe(0)
  })

  it('treats a null data_limit the same as 0 (unlimited)', () => {
    const patch = buildRenewalPatch(makeUser({ data_limit: null }), { addDataBytes: 500 }, NOW)
    expect(patch.data_limit).toBe(0)
  })

  it('omits data_limit from the patch when addDataBytes is not requested', () => {
    const patch = buildRenewalPatch(makeUser(), { addDurationMs: 1000 }, NOW)
    expect(patch.data_limit).toBeUndefined()
  })

  it('reactivates an expired user', () => {
    const patch = buildRenewalPatch(makeUser({ status: 'expired' }), {}, NOW)
    expect(patch.status).toBe('active')
  })

  it('reactivates a limited user', () => {
    const patch = buildRenewalPatch(makeUser({ status: 'limited' }), {}, NOW)
    expect(patch.status).toBe('active')
  })

  it('does not touch status for an already-active user', () => {
    const patch = buildRenewalPatch(makeUser({ status: 'active' }), {}, NOW)
    expect(patch.status).toBeUndefined()
  })

  it('does not touch status for an on_hold or disabled user', () => {
    expect(buildRenewalPatch(makeUser({ status: 'on_hold' }), {}, NOW).status).toBeUndefined()
    expect(buildRenewalPatch(makeUser({ status: 'disabled' }), {}, NOW).status).toBeUndefined()
  })
})
