import type { CoreStats, ProxyInbound, SystemStats } from 'marzban-sdk'
import { describe, expect, it } from 'vitest'

import type { ViewOptions, ViewRow } from '@/format/views/types'

import type { SystemStatsResult } from './system.views'
import { systemInboundsView, systemStatsView } from './system.views'

const HIDE: ViewOptions = { showLinks: false }

function makeSystemStats(overrides: Partial<SystemStats> = {}): SystemStats {
  return {
    version: '1.0.0',
    mem_total: 1000,
    mem_used: 500,
    cpu_cores: 4,
    cpu_usage: 12.345,
    total_user: 10,
    online_users: 3,
    users_active: 8,
    users_on_hold: 1,
    users_disabled: 0,
    users_expired: 1,
    users_limited: 0,
    incoming_bandwidth: 2000,
    outgoing_bandwidth: 3000,
    incoming_bandwidth_speed: 100,
    outgoing_bandwidth_speed: 200,
    ...overrides,
  }
}

function makeCoreStats(overrides: Partial<CoreStats> = {}): CoreStats {
  return { version: '25.1.30', started: true, logs_websocket: '/api/core/logs', ...overrides }
}

describe('systemStatsView', () => {
  it('formats bytes, percentages, and user status counts into a single row', () => {
    const fixture: SystemStatsResult = { system: makeSystemStats(), core: makeCoreStats() }
    const row = systemStatsView.compact(fixture, HIDE) as ViewRow

    expect(row).toMatchObject({
      version: '1.0.0',
      core_version: '25.1.30',
      core_started: true,
      cpu: '12.3% / 4 cores',
      memory: '500 B / 1000 B',
      users: '10 total, 3 online',
      users_by_status: 'active 8, on_hold 1, disabled 0, expired 1, limited 0',
    })
    expect(row.bandwidth_total).toBe('down 1.95 KB / up 2.93 KB')
    expect(row.bandwidth_speed).toBe('down 100 B/s / up 200 B/s')
  })
})

describe('systemInboundsView', () => {
  function makeInbound(overrides: Partial<ProxyInbound> = {}): ProxyInbound {
    return { tag: 'vless-in', protocol: 'vless', network: 'tcp', tls: 'reality', port: 443, ...overrides }
  }

  it('flattens the protocol-grouped map into one row per inbound', () => {
    const inbounds = { vless: [makeInbound()], vmess: [makeInbound({ tag: 'vmess-in', protocol: 'vmess' })] }
    const rows = systemInboundsView.compact(inbounds, HIDE) as ViewRow[]

    expect(rows).toEqual([
      { group: 'vless', tag: 'vless-in', protocol: 'vless', network: 'tcp', tls: 'reality', port: 443 },
      { group: 'vmess', tag: 'vmess-in', protocol: 'vmess', network: 'tcp', tls: 'reality', port: 443 },
    ])
  })

  it('returns an empty array for an empty map', () => {
    expect(systemInboundsView.compact({}, HIDE)).toEqual([])
  })
})
