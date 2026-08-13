import type { MarzbanSDK } from 'marzban-sdk'
import { describe, expect, it, vi } from 'vitest'

import type { McpConfig } from '@/config'
import type { ToolContext } from '@/core/context'

import { nodesListTool } from './nodes.tools'

function makeContext(sdkOverrides: Record<string, unknown> = {}): ToolContext {
  return {
    sdk: sdkOverrides as unknown as MarzbanSDK,
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    config: {} as McpConfig,
  }
}

describe('nodesListTool', () => {
  it('combines nodes and usage, forwarding start/end', async () => {
    const nodes = [{ id: 1, name: 'node-1', address: '1.2.3.4', status: 'connected' }]
    const usages = [{ node_name: 'node-1', uplink: 100, downlink: 200 }]
    const getNodes = vi.fn().mockResolvedValue(nodes)
    const getUsage = vi.fn().mockResolvedValue({ usages })
    const ctx = makeContext({ node: { getNodes, getUsage } })

    const result = await nodesListTool.handler({ start: '2026-01-01', end: '2026-02-01' }, ctx)

    expect(getUsage).toHaveBeenCalledWith({ start: '2026-01-01', end: '2026-02-01' })
    expect(result).toEqual({ nodes, usage: usages })
  })
})
