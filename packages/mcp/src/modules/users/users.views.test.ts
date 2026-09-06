import type { UserResponse, UserUsageResponse } from 'marzban-sdk'
import { describe, expect, it } from 'vitest'

import type { ViewRow } from '@/format/views/types'

import type { UserDeleted, UserExtended, UserList, UsersResetTraffic, UserUsage, UserWithSummary } from './users.views'
import {
  userDeletedView,
  userExtendedView,
  userListView,
  usersResetTrafficView,
  userUsageView,
  userView,
  userWithSummaryView,
} from './users.views'

const SHOW: { showLinks: boolean } = { showLinks: true }
const HIDE: { showLinks: boolean } = { showLinks: false }

function makeUser(overrides: Partial<UserResponse> = {}): UserResponse {
  return {
    proxies: {},
    username: 'alice',
    status: 'active',
    used_traffic: 0,
    created_at: '2026-01-01T00:00:00',
    ...overrides,
  }
}

describe('userView (single user)', () => {
  it('compact row has the core fields', () => {
    const row = userView.compact(makeUser({ status: 'active', used_traffic: 500, data_limit: 1000 }), HIDE) as ViewRow
    expect(row).toMatchObject({ username: 'alice', status: 'active', usage: '500 B / 1000 B' })
  })

  it('shows "unlimited" in usage when data_limit is 0 or unset', () => {
    expect(userView.compact(makeUser({ data_limit: 0 }), HIDE)).toMatchObject({ usage: '0 B / unlimited' })
    expect(userView.compact(makeUser({}), HIDE)).toMatchObject({ usage: '0 B / unlimited' })
  })

  it('shows "never" for expire when unset or 0', () => {
    expect(userView.compact(makeUser({ expire: 0 }), HIDE)).toMatchObject({ expire: 'never' })
    expect(userView.compact(makeUser({}), HIDE)).toMatchObject({ expire: 'never' })
  })

  it('shows a date plus remaining time for a future expire', () => {
    const expire = Math.floor(Date.now() / 1000) + 86_400
    const row = userView.compact(makeUser({ expire }), HIDE) as ViewRow
    expect(row.expire).toContain(new Date(expire * 1000).toISOString().slice(0, 10))
  })

  it('falls back to "never" for online_at when unset', () => {
    expect(userView.compact(makeUser({}), HIDE)).toMatchObject({ online_at: 'never' })
  })

  it('carries online_at through when set', () => {
    expect(userView.compact(makeUser({ online_at: '2026-08-01T00:00:00Z' }), HIDE)).toMatchObject({
      online_at: '2026-08-01T00:00:00Z',
    })
  })

  it('full row includes note/reset-strategy/created_at on top of the compact fields', () => {
    const row = userView.full!(makeUser({ note: 'vip', data_limit_reset_strategy: 'month' }), HIDE) as ViewRow
    expect(row).toMatchObject({ note: 'vip', data_limit_reset_strategy: 'month', created_at: '2026-01-01T00:00:00' })
  })

  it('defaults reset strategy display to no_reset when unset', () => {
    const row = userView.full!(makeUser({}), HIDE) as ViewRow
    expect(row).toMatchObject({ data_limit_reset_strategy: 'no_reset' })
  })

  it('masks proxies to protocol names only when showLinks is false', () => {
    const row = userView.full!(makeUser({ proxies: { vless: { id: 'secret-uuid' } } }), HIDE) as ViewRow
    expect(row.proxies).toBe('vless (hidden — set MARZBAN_MCP_SHOW_LINKS=true to reveal)')
  })

  it('reveals full proxies JSON when showLinks is true', () => {
    const row = userView.full!(makeUser({ proxies: { vless: { id: 'secret-uuid' } } }), SHOW) as ViewRow
    expect(row.proxies).toBe(JSON.stringify({ vless: { id: 'secret-uuid' } }))
  })

  it('reports "(none)" for empty proxies regardless of showLinks', () => {
    expect(userView.full!(makeUser({ proxies: {} }), HIDE)).toMatchObject({ proxies: '(none)' })
    expect(userView.full!(makeUser({ proxies: {} }), SHOW)).toMatchObject({ proxies: '(none)' })
  })

  it('shows "(all)" for inbounds when unset or empty', () => {
    expect(userView.full!(makeUser({}), HIDE)).toMatchObject({ inbounds: '(all)' })
    expect(userView.full!(makeUser({ inbounds: {} }), HIDE)).toMatchObject({ inbounds: '(all)' })
  })

  it('shows inbounds as JSON when set', () => {
    const row = userView.full!(makeUser({ inbounds: { vless: ['tag1'] } }), HIDE) as ViewRow
    expect(row.inbounds).toBe(JSON.stringify({ vless: ['tag1'] }))
  })

  it('shows "(none)" for excluded_inbounds when unset or empty', () => {
    expect(userView.full!(makeUser({}), HIDE)).toMatchObject({ excluded_inbounds: '(none)' })
    expect(userView.full!(makeUser({ excluded_inbounds: {} }), HIDE)).toMatchObject({ excluded_inbounds: '(none)' })
  })

  it('shows excluded_inbounds as JSON when set', () => {
    const row = userView.full!(makeUser({ excluded_inbounds: { vless: ['tag1'] } }), HIDE) as ViewRow
    expect(row.excluded_inbounds).toBe(JSON.stringify({ vless: ['tag1'] }))
  })

  it('masks subscription_url to its origin when showLinks is false', () => {
    const row = userView.full!(
      makeUser({ subscription_url: 'https://panel.example.com/sub/deadbeef' }),
      HIDE
    ) as ViewRow
    expect(row.subscription_url).toBe(
      'https://panel.example.com/*** (hidden — set MARZBAN_MCP_SHOW_LINKS=true to reveal)'
    )
  })

  it('reveals the full subscription_url when showLinks is true', () => {
    const row = userView.full!(
      makeUser({ subscription_url: 'https://panel.example.com/sub/deadbeef' }),
      SHOW
    ) as ViewRow
    expect(row.subscription_url).toBe('https://panel.example.com/sub/deadbeef')
  })

  it('renders an empty subscription_url as an empty string', () => {
    expect(userView.full!(makeUser({ subscription_url: '' }), HIDE)).toMatchObject({ subscription_url: '' })
  })

  it('masks an unparsable subscription_url without throwing', () => {
    const row = userView.full!(makeUser({ subscription_url: 'not a url' }), HIDE) as ViewRow
    expect(row.subscription_url).toBe('*** (hidden — set MARZBAN_MCP_SHOW_LINKS=true to reveal)')
  })

  it('masks links to a count when showLinks is false', () => {
    const row = userView.full!(makeUser({ links: ['vless://a', 'vless://b'] }), HIDE) as ViewRow
    expect(row.links).toBe('2 link(s) (hidden — set MARZBAN_MCP_SHOW_LINKS=true to reveal)')
  })

  it('reveals full links when showLinks is true', () => {
    const row = userView.full!(makeUser({ links: ['vless://a', 'vless://b'] }), SHOW) as ViewRow
    expect(row.links).toBe('vless://a, vless://b')
  })

  it('reports "(none)" for empty/unset links', () => {
    expect(userView.full!(makeUser({}), HIDE)).toMatchObject({ links: '(none)' })
    expect(userView.full!(makeUser({ links: [] }), HIDE)).toMatchObject({ links: '(none)' })
  })
})

describe('userWithSummaryView', () => {
  const fixture: UserWithSummary = {
    user: makeUser({ data_limit: 1000, used_traffic: 250 }),
    summary: { dataLeftBytes: 750, usagePercent: 25, daysLeft: 10, isExpired: false },
  }

  it('compact adds days_left and usage_percent to the user row', () => {
    const row = userWithSummaryView.compact(fixture, HIDE)
    expect(row).toMatchObject({ username: 'alice', days_left: 10, usage_percent: 25 })
  })

  it('compact falls back to an em dash placeholder for null summary fields', () => {
    const row = userWithSummaryView.compact(
      { user: fixture.user, summary: { dataLeftBytes: null, usagePercent: null, daysLeft: null, isExpired: false } },
      HIDE
    )
    expect(row).toMatchObject({ days_left: '—', usage_percent: '—' })
  })

  it('full adds data_left, usage_percent, and is_expired', () => {
    const row = userWithSummaryView.full!(fixture, HIDE)
    expect(row).toMatchObject({ data_left: '750 B', usage_percent: '25.0%', is_expired: false })
  })

  it('full falls back to an em dash placeholder for null summary fields', () => {
    const row = userWithSummaryView.full!(
      { user: fixture.user, summary: { dataLeftBytes: null, usagePercent: null, daysLeft: null, isExpired: true } },
      HIDE
    )
    expect(row).toMatchObject({ days_left: '—', data_left: '—', usage_percent: '—', is_expired: true })
  })
})

describe('userListView', () => {
  const fixture: UserList = {
    users: [makeUser({ username: 'alice' }), makeUser({ username: 'bob' })],
    total: 2,
    note: 'Showing all 2.',
  }

  it('compact renders one row per user plus a trailing note row', () => {
    const rows = userListView.compact(fixture, HIDE) as Record<string, unknown>[]
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ username: 'alice' })
    expect(rows[1]).toMatchObject({ username: 'bob' })
    expect(rows[2]).toEqual({ note: 'Showing all 2.' })
  })

  it('full renders full rows per user plus a trailing note row', () => {
    const rows = userListView.full!(fixture, HIDE) as Record<string, unknown>[]
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveProperty('proxies')
    expect(rows[2]).toEqual({ note: 'Showing all 2.' })
  })
})

describe('userExtendedView', () => {
  const fixture: UserExtended = { user: makeUser(), note: 'expire moved to 2026-09-01' }

  it('compact adds the note to the user row', () => {
    expect(userExtendedView.compact(fixture, HIDE)).toMatchObject({ username: 'alice', note: fixture.note })
  })

  it('full adds the note to the full user row', () => {
    const row = userExtendedView.full!(fixture, HIDE)
    expect(row).toMatchObject({ note: fixture.note })
    expect(row).toHaveProperty('proxies')
  })
})

describe('userUsageView', () => {
  function makeNode(overrides: Partial<UserUsageResponse> = {}): UserUsageResponse {
    return { node_name: 'node-1', used_traffic: 100, ...overrides }
  }

  it('renders a summary row followed by one row per node', () => {
    const usage: UserUsage = {
      username: 'alice',
      usedTraffic: 300,
      lifetimeUsedTraffic: 900,
      dataLimit: 1000,
      byNode: [
        makeNode({ node_name: 'node-1', used_traffic: 100 }),
        makeNode({ node_name: 'node-2', used_traffic: 200 }),
      ],
    }
    const rows = userUsageView.compact(usage, HIDE) as Record<string, unknown>[]
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ username: 'alice', used_traffic: '300 B', data_limit: '1000 B' })
    expect(rows[1]).toEqual({ node: 'node-1', used: '100 B' })
    expect(rows[2]).toEqual({ node: 'node-2', used: '200 B' })
  })

  it('shows "unlimited" for a null or zero dataLimit', () => {
    const base = { username: 'alice', usedTraffic: 0, lifetimeUsedTraffic: 0, byNode: [] }
    expect((userUsageView.compact({ ...base, dataLimit: null }, HIDE) as Record<string, unknown>[])[0]).toMatchObject({
      data_limit: 'unlimited',
    })
    expect((userUsageView.compact({ ...base, dataLimit: 0 }, HIDE) as Record<string, unknown>[])[0]).toMatchObject({
      data_limit: 'unlimited',
    })
  })
})

describe('userDeletedView', () => {
  it('reports the deleted username', () => {
    const fixture: UserDeleted = { username: 'alice', deleted: true }
    expect(userDeletedView.compact(fixture, HIDE)).toEqual({ username: 'alice', status: 'deleted' })
  })
})

describe('usersResetTrafficView', () => {
  it('reports a single-user reset with formatted usage', () => {
    const fixture: UsersResetTraffic = { scope: 'single', username: 'alice', usedTraffic: 1000 }
    expect(usersResetTrafficView.compact(fixture, HIDE)).toEqual({
      scope: 'single',
      username: 'alice',
      used_traffic: '1000 B',
      note: null,
    })
  })

  it('falls back to empty/zero when a single-scope result is missing username or usedTraffic', () => {
    const fixture: UsersResetTraffic = { scope: 'single', username: null, usedTraffic: null }
    expect(usersResetTrafficView.compact(fixture, HIDE)).toEqual({
      scope: 'single',
      username: '',
      used_traffic: '0 B',
      note: null,
    })
  })

  it('reports an all-users reset', () => {
    const fixture: UsersResetTraffic = { scope: 'all', username: null, usedTraffic: null }
    expect(usersResetTrafficView.compact(fixture, HIDE)).toEqual({
      scope: 'all',
      note: 'Data usage reset for all users.',
      username: null,
      used_traffic: null,
    })
  })
})
