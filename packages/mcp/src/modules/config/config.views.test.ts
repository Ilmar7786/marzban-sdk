import type { ProxyHost } from 'marzban-sdk'
import { describe, expect, it } from 'vitest'

import type { ViewOptions, ViewRow } from '@/format/views/types'

import type { CoreConfigSummary } from './config.helpers'
import type { ConfigGetResult, ConfigUpdateResult, HostsGetResult, HostsUpdateResult } from './config.views'
import { configGetView, configUpdateView, coreRestartView, hostsGetView, hostsUpdateView } from './config.views'

const HIDE: ViewOptions = { showLinks: false }

describe('configGetView', () => {
  const summary: CoreConfigSummary = {
    inbounds: [{ tag: 'vless-in', port: 443, protocol: 'vless' }],
    outbounds: [{ tag: 'direct', protocol: 'freedom' }],
    routingRulesCount: 2,
    otherTopLevelKeys: ['dns'],
  }

  it('renders one row per inbound/outbound plus summary rows in summary mode', () => {
    const fixture: ConfigGetResult = { mode: 'summary', section: null, summary, data: null }
    const rows = configGetView.compact(fixture, HIDE) as ViewRow[]
    expect(rows).toContainEqual({ tag: 'vless-in', port: 443, protocol: 'vless' })
    expect(rows).toContainEqual({ tag: 'direct', protocol: 'freedom' })
    expect(rows).toContainEqual({ section: 'routing', rules: 2 })
    expect(rows).toContainEqual({ other_top_level_keys: 'dns' })
  })

  it('falls back to "(none)" for an empty otherTopLevelKeys list', () => {
    const fixture: ConfigGetResult = {
      mode: 'summary',
      section: null,
      summary: { ...summary, otherTopLevelKeys: [] },
      data: null,
    }
    const rows = configGetView.compact(fixture, HIDE) as ViewRow[]
    expect(rows).toContainEqual({ other_top_level_keys: '(none)' })
  })

  it('falls back to placeholders for untagged/protocol-less inbounds', () => {
    const fixture: ConfigGetResult = {
      mode: 'summary',
      section: null,
      summary: { ...summary, inbounds: [{ tag: null, port: null, protocol: null }] },
      data: null,
    }
    const rows = configGetView.compact(fixture, HIDE) as ViewRow[]
    expect(rows).toContainEqual({ tag: '(untagged)', port: '', protocol: '' })
  })

  it('falls back to placeholders for untagged/protocol-less outbounds', () => {
    const fixture: ConfigGetResult = {
      mode: 'summary',
      section: null,
      summary: { ...summary, outbounds: [{ tag: null, protocol: null }] },
      data: null,
    }
    const rows = configGetView.compact(fixture, HIDE) as ViewRow[]
    expect(rows).toContainEqual({ tag: '(untagged)', protocol: '' })
  })

  it('defaults routing rule count to 0 when null', () => {
    const fixture: ConfigGetResult = {
      mode: 'summary',
      section: null,
      summary: { ...summary, routingRulesCount: null },
      data: null,
    }
    const rows = configGetView.compact(fixture, HIDE) as ViewRow[]
    expect(rows).toContainEqual({ section: 'routing', rules: 0 })
  })

  it('renders raw JSON for section mode', () => {
    const fixture: ConfigGetResult = { mode: 'section', section: 'inbounds', summary: null, data: [{ tag: 'a' }] }
    expect(configGetView.compact(fixture, HIDE)).toEqual({
      mode: 'section',
      section: 'inbounds',
      json: JSON.stringify([{ tag: 'a' }]),
    })
  })

  it('renders "(all)" for raw mode with no section', () => {
    const fixture: ConfigGetResult = { mode: 'raw', section: null, summary: null, data: { a: 1 } }
    expect(configGetView.compact(fixture, HIDE)).toEqual({
      mode: 'raw',
      section: '(all)',
      json: JSON.stringify({ a: 1 }),
    })
  })
})

describe('configUpdateView', () => {
  it('reports applied/restarted and the diff, falling back to "(none)" per empty list', () => {
    const fixture: ConfigUpdateResult = {
      applied: true,
      restarted: true,
      diff: { addedKeys: ['dns'], removedKeys: [], changedKeys: ['inbounds'] },
      backup: { a: 1 },
    }
    expect(configUpdateView.compact(fixture, HIDE)).toEqual({
      applied: true,
      restarted: true,
      added: 'dns',
      removed: '(none)',
      changed: 'inbounds',
    })
  })

  it('falls back to "(none)" for added and changed when only removed is non-empty', () => {
    const fixture: ConfigUpdateResult = {
      applied: false,
      restarted: false,
      diff: { addedKeys: [], removedKeys: ['dns'], changedKeys: [] },
      backup: null,
    }
    expect(configUpdateView.compact(fixture, HIDE)).toEqual({
      applied: false,
      restarted: false,
      added: '(none)',
      removed: 'dns',
      changed: '(none)',
    })
  })
})

describe('coreRestartView', () => {
  it('reports restarted', () => {
    expect(coreRestartView.compact({ restarted: true }, HIDE)).toEqual({ restarted: true })
  })
})

describe('hostsGetView', () => {
  function makeHost(overrides: Partial<ProxyHost> = {}): ProxyHost {
    return { remark: 'r', address: 'a', ...overrides }
  }

  it('renders one row per host across inbound tags', () => {
    const fixture: HostsGetResult = {
      hosts: { 'vless-in': [makeHost({ remark: 'one' }), makeHost({ remark: 'two', is_disabled: true })] },
      warnings: [],
    }
    const rows = hostsGetView.compact(fixture, HIDE) as ViewRow[]
    expect(rows).toEqual([
      { inbound_tag: 'vless-in', index: 0, remark: 'one', address: 'a', disabled: false },
      { inbound_tag: 'vless-in', index: 1, remark: 'two', address: 'a', disabled: true },
    ])
  })

  it('appends a warning row when there are template-variable warnings', () => {
    const fixture: HostsGetResult = {
      hosts: { 'vless-in': [makeHost()] },
      warnings: [{ inboundTag: 'vless-in', index: 0, field: 'remark', unknownVariables: ['TYPO'] }],
    }
    const rows = hostsGetView.compact(fixture, HIDE) as ViewRow[]
    expect(rows).toHaveLength(2)
    expect(rows[1].warning).toContain('1 host field(s)')
  })
})

describe('hostsUpdateView', () => {
  it('reports the number and names of updated inbound tags', () => {
    const fixture: HostsUpdateResult = { hosts: { a: [], b: [] }, backup: {} }
    expect(hostsUpdateView.compact(fixture, HIDE)).toEqual({ inbound_tags_updated: 2, tags: 'a, b' })
  })

  it('reports "(none)" when no tags are present', () => {
    const fixture: HostsUpdateResult = { hosts: {}, backup: {} }
    expect(hostsUpdateView.compact(fixture, HIDE)).toEqual({ inbound_tags_updated: 0, tags: '(none)' })
  })
})
