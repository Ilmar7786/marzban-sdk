import type { ProxyHost } from 'marzban-sdk'
import { describe, expect, it } from 'vitest'

import { diffTopLevelKeys, summarizeCoreConfig, validateHostTemplates } from './config.helpers'

describe('summarizeCoreConfig', () => {
  it('summarizes inbounds, outbounds, and routing rule count', () => {
    const config = {
      log: { loglevel: 'warning' },
      inbounds: [{ tag: 'vless-in', port: 443, protocol: 'vless' }],
      outbounds: [{ tag: 'direct', protocol: 'freedom' }],
      routing: { rules: [{ type: 'field' }, { type: 'field' }] },
      dns: { servers: [] },
    }

    const summary = summarizeCoreConfig(config)

    expect(summary.inbounds).toEqual([{ tag: 'vless-in', port: 443, protocol: 'vless' }])
    expect(summary.outbounds).toEqual([{ tag: 'direct', protocol: 'freedom' }])
    expect(summary.routingRulesCount).toBe(2)
    expect(summary.otherTopLevelKeys).toEqual(['dns'])
  })

  it('defaults to empty/null when inbounds, outbounds, or routing are missing', () => {
    const summary = summarizeCoreConfig({})
    expect(summary.inbounds).toEqual([])
    expect(summary.outbounds).toEqual([])
    expect(summary.routingRulesCount).toBeNull()
    expect(summary.otherTopLevelKeys).toEqual([])
  })

  it('is defensive about non-array inbounds/outbounds and non-object routing', () => {
    const summary = summarizeCoreConfig({ inbounds: 'not-an-array', outbounds: null, routing: 'not-an-object' })
    expect(summary.inbounds).toEqual([])
    expect(summary.outbounds).toEqual([])
    expect(summary.routingRulesCount).toBeNull()
  })

  it('is defensive about non-object entries and non-string/number ports inside inbounds/outbounds', () => {
    const summary = summarizeCoreConfig({ inbounds: [null, { tag: 42, port: true, protocol: 7 }], outbounds: [null] })
    expect(summary.inbounds).toEqual([
      { tag: null, port: null, protocol: null },
      { tag: null, port: null, protocol: null },
    ])
    expect(summary.outbounds).toEqual([{ tag: null, protocol: null }])
  })

  it('accepts a string port', () => {
    const summary = summarizeCoreConfig({ inbounds: [{ tag: 'a', port: '443-450' }] })
    expect(summary.inbounds[0].port).toBe('443-450')
  })

  it('routing.rules that is not an array yields a null count', () => {
    const summary = summarizeCoreConfig({ routing: { rules: 'nope' } })
    expect(summary.routingRulesCount).toBeNull()
  })
})

describe('diffTopLevelKeys', () => {
  it('reports added, removed, and changed top-level keys', () => {
    const before = { a: 1, b: 2, c: 3 }
    const after = { a: 1, b: 20, d: 4 }

    const diff = diffTopLevelKeys(before, after)

    expect(diff.addedKeys).toEqual(['d'])
    expect(diff.removedKeys).toEqual(['c'])
    expect(diff.changedKeys).toEqual(['b'])
  })

  it('reports no differences for identical objects', () => {
    const diff = diffTopLevelKeys({ a: 1 }, { a: 1 })
    expect(diff).toEqual({ addedKeys: [], removedKeys: [], changedKeys: [] })
  })
})

describe('validateHostTemplates', () => {
  function makeHost(overrides: Partial<ProxyHost> = {}): ProxyHost {
    return { remark: 'remark', address: 'address', ...overrides }
  }

  it('reports no warnings when every template field uses only known variables', () => {
    const hosts = { 'vless-in': [makeHost({ remark: '{USERNAME}', address: '{SERVER_IP}' })] }
    expect(validateHostTemplates(hosts)).toEqual([])
  })

  it('flags an unknown variable in any of the template fields', () => {
    const hosts = {
      'vless-in': [makeHost({ remark: '{TYPO}', address: 'a', host: 'h', sni: 's', path: 'p' })],
    }
    const warnings = validateHostTemplates(hosts)
    expect(warnings).toEqual([{ inboundTag: 'vless-in', index: 0, field: 'remark', unknownVariables: ['TYPO'] }])
  })

  it('skips fields that are absent, empty, or non-string', () => {
    const hosts = { 'vless-in': [makeHost({ port: 443, sni: null, path: undefined })] }
    expect(validateHostTemplates(hosts)).toEqual([])
  })

  it('covers multiple inbound tags and multiple hosts per tag', () => {
    const hosts = {
      a: [makeHost({ remark: '{TYPO_A}' })],
      b: [makeHost({ remark: 'ok' }), makeHost({ remark: '{TYPO_B}' })],
    }
    const warnings = validateHostTemplates(hosts)
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toMatchObject({ inboundTag: 'a', index: 0 })
    expect(warnings[1]).toMatchObject({ inboundTag: 'b', index: 1 })
  })
})
