import { McpServer } from '@modelcontextprotocol/server'
import { describe, expect, it } from 'vitest'

import { createMarzbanMcpServer } from './server'

describe('createMarzbanMcpServer', () => {
  it('returns an unconnected McpServer instance', () => {
    const server = createMarzbanMcpServer({ name: 'marzban-mcp', version: '0.0.0' })
    expect(server).toBeInstanceOf(McpServer)
    expect(server.isConnected()).toBe(false)
  })

  it('creates independent instances per call', () => {
    const a = createMarzbanMcpServer({ name: 'marzban-mcp', version: '0.0.0' })
    const b = createMarzbanMcpServer({ name: 'marzban-mcp', version: '0.0.0' })
    expect(a).not.toBe(b)
  })
})
