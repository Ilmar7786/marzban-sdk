import type { MarzbanSDK } from 'marzban-sdk'
import { describe, expect, it, vi } from 'vitest'

import type { McpConfig } from '@/config'
import type { ToolContext } from '@/core/tool'

import { configGetTool, configUpdateTool, coreRestartTool, hostsGetTool, hostsUpdateTool } from './config.tools'

function makeContext(sdkOverrides: Record<string, unknown> = {}): ToolContext {
  return {
    sdk: sdkOverrides as unknown as MarzbanSDK,
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    config: {} as McpConfig,
  }
}

describe('configGetTool', () => {
  const config = { inbounds: [{ tag: 'a', port: 443, protocol: 'vless' }], outbounds: [], routing: { rules: [] } }

  it('returns a structural summary when section is omitted', async () => {
    const getCoreConfig = vi.fn().mockResolvedValue(config)
    const ctx = makeContext({ core: { getCoreConfig } })

    const result = await configGetTool.handler({}, ctx)

    expect(result.mode).toBe('summary')
    expect(result.section).toBeNull()
    expect(result.data).toBeNull()
    expect(result.summary?.inbounds).toEqual([{ tag: 'a', port: 443, protocol: 'vless' }])
  })

  it('returns one top-level key raw when section is given', async () => {
    const getCoreConfig = vi.fn().mockResolvedValue(config)
    const ctx = makeContext({ core: { getCoreConfig } })

    const result = await configGetTool.handler({ section: 'outbounds' }, ctx)

    expect(result).toEqual({ mode: 'section', section: 'outbounds', summary: null, data: [] })
  })

  it('returns null data for a section key that is not present', async () => {
    const getCoreConfig = vi.fn().mockResolvedValue(config)
    const ctx = makeContext({ core: { getCoreConfig } })

    const result = await configGetTool.handler({ section: 'dns' }, ctx)

    expect(result.data).toBeNull()
  })

  it('returns the entire config raw when section is "raw"', async () => {
    const getCoreConfig = vi.fn().mockResolvedValue(config)
    const ctx = makeContext({ core: { getCoreConfig } })

    const result = await configGetTool.handler({ section: 'raw' }, ctx)

    expect(result).toEqual({ mode: 'raw', section: null, summary: null, data: config })
  })
})

describe('configUpdateTool', () => {
  const current = { inbounds: [{ tag: 'a' }], outbounds: [] }
  const next = { inbounds: [{ tag: 'a' }], outbounds: [], dns: {} }

  it('dry run returns the diff without writing', async () => {
    const getCoreConfig = vi.fn().mockResolvedValue(current)
    const modifyCoreConfig = vi.fn()
    const ctx = makeContext({ core: { getCoreConfig, modifyCoreConfig } })

    const result = await configUpdateTool.handler({ config: next, dryRun: true }, ctx)

    expect(modifyCoreConfig).not.toHaveBeenCalled()
    expect(result).toEqual({
      applied: false,
      restarted: false,
      diff: { addedKeys: ['dns'], removedKeys: [], changedKeys: [] },
      backup: null,
    })
  })

  it('a real write calls modifyCoreConfig and returns the pre-write config as backup', async () => {
    const getCoreConfig = vi.fn().mockResolvedValue(current)
    const modifyCoreConfig = vi.fn().mockResolvedValue({})
    const ctx = makeContext({ core: { getCoreConfig, modifyCoreConfig } })

    const result = await configUpdateTool.handler({ config: next }, ctx)

    expect(modifyCoreConfig).toHaveBeenCalledWith(next)
    expect(result.applied).toBe(true)
    expect(result.restarted).toBe(true)
    expect(result.backup).toEqual(current)
  })

  it('skipConfirm is true only when dryRun is true', () => {
    expect(configUpdateTool.skipConfirm!({ config: next, dryRun: true }, makeContext())).toBe(true)
    expect(configUpdateTool.skipConfirm!({ config: next }, makeContext())).toBe(false)
  })

  it('describeConsequences reports the diff', async () => {
    const getCoreConfig = vi.fn().mockResolvedValue(current)
    const ctx = makeContext({ core: { getCoreConfig } })

    const text = await configUpdateTool.describeConsequences!({ config: next }, ctx)

    expect(text).toContain('RESTART THE CORE')
    expect(text).toContain('added: dns')
  })

  it('describeConsequences reports removed and changed sections too, and "none" when a category is empty', async () => {
    const before = { inbounds: [{ tag: 'a' }], outbounds: [], dns: {} }
    const after = { inbounds: [{ tag: 'b' }], outbounds: [] }
    const getCoreConfig = vi.fn().mockResolvedValue(before)
    const ctx = makeContext({ core: { getCoreConfig } })

    const text = await configUpdateTool.describeConsequences!({ config: after }, ctx)

    expect(text).toContain('added: none')
    expect(text).toContain('removed: dns')
    expect(text).toContain('changed: inbounds')
  })

  it('describeConsequences falls back to a generic description when the panel is unreachable', async () => {
    const getCoreConfig = vi.fn().mockRejectedValue(new Error('network error'))
    const ctx = makeContext({ core: { getCoreConfig } })

    const text = await configUpdateTool.describeConsequences!({ config: next }, ctx)

    expect(text).toContain('RESTART THE CORE')
    expect(text).toContain('Could not fetch the current config')
  })
})

describe('coreRestartTool', () => {
  it('calls restartCore and reports restarted', async () => {
    const restartCore = vi.fn().mockResolvedValue(undefined)
    const ctx = makeContext({ core: { restartCore } })

    const result = await coreRestartTool.handler({}, ctx)

    expect(restartCore).toHaveBeenCalled()
    expect(result).toEqual({ restarted: true })
  })

  it('describeConsequences returns a fixed warning', async () => {
    const text = await coreRestartTool.describeConsequences!({}, makeContext())
    expect(text).toContain('drop')
  })
})

describe('hostsGetTool', () => {
  it('returns hosts and template-variable warnings', async () => {
    const hosts = { 'vless-in': [{ remark: '{TYPO}', address: 'a' }] }
    const getHosts = vi.fn().mockResolvedValue(hosts)
    const ctx = makeContext({ system: { getHosts } })

    const result = await hostsGetTool.handler({}, ctx)

    expect(result.hosts).toBe(hosts)
    expect(result.warnings).toEqual([{ inboundTag: 'vless-in', index: 0, field: 'remark', unknownVariables: ['TYPO'] }])
  })
})

describe('hostsUpdateTool', () => {
  it('fetches the current hosts as backup and writes the new ones', async () => {
    const backup = { a: [] }
    const updated = { b: [] }
    const getHosts = vi.fn().mockResolvedValue(backup)
    const modifyHosts = vi.fn().mockResolvedValue(updated)
    const ctx = makeContext({ system: { getHosts, modifyHosts } })

    const result = await hostsUpdateTool.handler({ hosts: { b: [] } }, ctx)

    expect(modifyHosts).toHaveBeenCalledWith({ b: [] })
    expect(result).toEqual({ hosts: updated, backup })
  })

  it('describeConsequences lists the tags being written, without calling the SDK', async () => {
    const getHosts = vi.fn()
    const ctx = makeContext({ system: { getHosts } })

    const text = await hostsUpdateTool.describeConsequences!({ hosts: { a: [], b: [] } }, ctx)

    expect(getHosts).not.toHaveBeenCalled()
    expect(text).toContain('a, b')
  })

  it('describeConsequences reports "(none)" for an empty hosts map', async () => {
    const text = await hostsUpdateTool.describeConsequences!({ hosts: {} }, makeContext())
    expect(text).toContain('(none)')
  })
})
