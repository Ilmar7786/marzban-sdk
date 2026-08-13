import type { MarzbanSDK } from 'marzban-sdk'
import { describe, expect, it, vi } from 'vitest'

import type { McpConfig } from '@/config'
import type { ToolContext } from '@/core/tool'

import { systemInboundsTool, systemStatsTool } from './system.tools'

function makeContext(sdkOverrides: Record<string, unknown> = {}): ToolContext {
  return {
    sdk: sdkOverrides as unknown as MarzbanSDK,
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    config: {} as McpConfig,
  }
}

describe('systemStatsTool', () => {
  it('combines system and core stats', async () => {
    const system = { version: '1.0.0' }
    const core = { version: '25.1.30', started: true }
    const getSystemStats = vi.fn().mockResolvedValue(system)
    const getCoreStats = vi.fn().mockResolvedValue(core)
    const ctx = makeContext({ system: { getSystemStats }, core: { getCoreStats } })

    const result = await systemStatsTool.handler({}, ctx)

    expect(result).toEqual({ system, core })
  })
})

describe('systemInboundsTool', () => {
  it('returns the raw inbounds map', async () => {
    const inbounds = { vless: [{ tag: 'a' }] }
    const getInbounds = vi.fn().mockResolvedValue(inbounds)
    const ctx = makeContext({ system: { getInbounds } })

    const result = await systemInboundsTool.handler({}, ctx)

    expect(result).toBe(inbounds)
  })
})
