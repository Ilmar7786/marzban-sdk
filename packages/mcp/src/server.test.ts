import { McpServer } from '@modelcontextprotocol/server'
import type { MarzbanSDK } from 'marzban-sdk'
import { describe, expect, it, vi } from 'vitest'

import type { McpConfig } from '@/config'
import type { ToolContext } from '@/core/context'

import { createMarzbanMcpServer } from './server'

function makeContext(overrides: Partial<McpConfig> = {}): ToolContext {
  return {
    sdk: {} as MarzbanSDK,
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    config: {
      baseUrl: 'https://panel.example.com',
      username: 'admin',
      password: 'secret',
      profile: 'standard',
      format: 'text',
      verbosity: 'compact',
      confirm: 'auto',
      maxChars: 8000,
      logLevel: 'warn',
      showLinks: false,
      ...overrides,
    },
  }
}

describe('createMarzbanMcpServer', () => {
  it('returns an unconnected McpServer instance', () => {
    const server = createMarzbanMcpServer({ name: 'marzban-mcp', version: '0.0.0' }, makeContext())
    expect(server).toBeInstanceOf(McpServer)
    expect(server.isConnected()).toBe(false)
  })

  it('creates independent instances per call', () => {
    const a = createMarzbanMcpServer({ name: 'marzban-mcp', version: '0.0.0' }, makeContext())
    const b = createMarzbanMcpServer({ name: 'marzban-mcp', version: '0.0.0' }, makeContext())
    expect(a).not.toBe(b)
  })

  it('registers the module tools against a real McpServer without throwing, for every profile', () => {
    for (const profile of ['readonly', 'standard', 'full'] as const) {
      expect(() =>
        createMarzbanMcpServer({ name: 'marzban-mcp', version: '0.0.0' }, makeContext({ profile }))
      ).not.toThrow()
    }
  })
})
