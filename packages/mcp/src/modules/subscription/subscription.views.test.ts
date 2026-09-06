import type { SubscriptionUserResponse } from 'marzban-sdk'
import { describe, expect, it } from 'vitest'

import type { ViewOptions, ViewRow } from '@/format/views/types'

import { subscriptionInfoView } from './subscription.views'

const HIDE: ViewOptions = { showLinks: false }

function makeSubscriptionUser(overrides: Partial<SubscriptionUserResponse> = {}): SubscriptionUserResponse {
  return {
    proxies: {},
    username: 'alice',
    status: 'active',
    used_traffic: 0,
    created_at: '2026-01-01T00:00:00', // Marzban's real wire format — no offset, see #112
    ...overrides,
  }
}

describe('subscriptionInfoView', () => {
  it('formats usage against the data limit', () => {
    const row = subscriptionInfoView.compact(makeSubscriptionUser({ used_traffic: 500, data_limit: 1000 }), HIDE)
    expect(row).toMatchObject({ username: 'alice', status: 'active', usage: '500 B / 1000 B' })
  })

  it('shows "unlimited" when data_limit is 0 or unset', () => {
    expect(subscriptionInfoView.compact(makeSubscriptionUser({ data_limit: 0 }), HIDE)).toMatchObject({
      usage: '0 B / unlimited',
    })
    expect(subscriptionInfoView.compact(makeSubscriptionUser({}), HIDE)).toMatchObject({ usage: '0 B / unlimited' })
  })

  it('shows "never" for expire when unset or 0', () => {
    expect(subscriptionInfoView.compact(makeSubscriptionUser({ expire: 0 }), HIDE)).toMatchObject({
      expire: 'never',
    })
    expect(subscriptionInfoView.compact(makeSubscriptionUser({}), HIDE)).toMatchObject({ expire: 'never' })
  })

  it('shows a date for a future expire', () => {
    const expire = Math.floor(Date.now() / 1000) + 86_400
    const row = subscriptionInfoView.compact(makeSubscriptionUser({ expire }), HIDE) as ViewRow
    expect(row.expire).toBe(new Date(expire * 1000).toISOString().slice(0, 10))
  })

  it('falls back to "never" for sub_updated_at when unset', () => {
    expect(subscriptionInfoView.compact(makeSubscriptionUser({}), HIDE)).toMatchObject({ sub_updated_at: 'never' })
  })

  it('carries sub_updated_at through when set', () => {
    expect(
      subscriptionInfoView.compact(makeSubscriptionUser({ sub_updated_at: '2026-08-01T00:00:00Z' }), HIDE)
    ).toMatchObject({ sub_updated_at: '2026-08-01T00:00:00Z' })
  })
})
