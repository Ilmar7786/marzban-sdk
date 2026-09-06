import type { JSONRPCMessage, ListToolsResult, Tool } from '@modelcontextprotocol/server'
import { InMemoryTransport, LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/server'
import type { MarzbanSDK } from 'marzban-sdk'
import { describe, expect, it, vi } from 'vitest'

import type { McpConfig } from '@/config'
import type { ToolContext } from '@/core/tool'

import { createMarzbanMcpServer } from './server'

/**
 * `tools/list` is sent in full at the start of every conversation, so its
 * serialised size is a cost every user of this server pays on every session —
 * unlike a handler, which only costs anything when it's actually called. The
 * 100% coverage thresholds in `vitest.shared.ts` say nothing about it: a
 * description can triple in length with coverage untouched (#77).
 *
 * Measured on the real payload — the server is driven over an in-memory
 * transport and asked the actual `tools/list` question — rather than
 * reconstructed from `selectTools()` + the zod→JSON Schema helpers. A
 * reconstruction would silently stop covering whatever `registerTools` adds
 * on top (annotations, titles, the schema conversion the MCP SDK does
 * itself), which is exactly the part most likely to grow without anyone
 * noticing.
 *
 * Bytes, not tokens: deterministic, needs no tokeniser dependency, and moves
 * proportionally with what actually matters. For a rough conversion, this
 * payload runs at roughly 4 characters per token — so the `full` budget below
 * is on the order of 16k tokens.
 */

/** Each profile's tool count, and the ceiling on its serialised `tools/list`.
 *
 * Measured 2026-09-06 at marzban-mcp 0.2.2 by this test (add a `console.log`
 * of `measure().bytes`, or read the number off a failure message — it prints
 * both the actual and the budget):
 *
 *   readonly  9 tools  22 636 B
 *   standard 15 tools  48 223 B
 *   full     21 tools  62 816 B
 *
 * Budgets are those numbers plus ~5%, rounded to something legible. That
 * headroom is deliberate: 5% of `full` is ~3 KB, which is more than every
 * tool description in the server put together (4.9 KB at the time of
 * measurement), so ordinary rewording never fails CI — but it is also less
 * than one average tool (~3 KB), so a new tool has to come with a deliberate
 * budget change. `tools` is pinned exactly for the same reason: a budget
 * alone would let a tool be added under cover of a few shortened
 * descriptions.
 *
 * Raising a number here is its own commit, with the justification in the
 * message — see docs/conventions.md, "Context budget".
 */
const TOOLS_LIST_BUDGET: Record<McpConfig['profile'], { tools: number; bytes: number }> = {
  readonly: { tools: 9, bytes: 24_000 },
  standard: { tools: 15, bytes: 51_000 },
  full: { tools: 21, bytes: 66_000 },
}

function makeContext(profile: McpConfig['profile']): ToolContext {
  return {
    sdk: {} as MarzbanSDK,
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    config: {
      baseUrl: 'https://panel.example.com',
      username: 'admin',
      password: 'secret',
      profile,
      format: 'text',
      verbosity: 'compact',
      confirm: 'auto',
      maxChars: 8000,
      logLevel: 'warn',
      showLinks: false,
    },
  }
}

/**
 * Asks a real, fully registered server for `tools/list` over a linked
 * in-memory transport pair, driving the handshake by hand (`initialize` →
 * `notifications/initialized` → `tools/list`) since this package depends on
 * the server SDK only — there's no client to borrow.
 */
async function fetchToolsList(profile: McpConfig['profile']): Promise<ListToolsResult> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = createMarzbanMcpServer({ name: 'marzban-mcp', version: '0.0.0' }, makeContext(profile))

  const pending = new Map<number, (result: unknown) => void>()
  clientTransport.onmessage = message => {
    if ('id' in message && 'result' in message) pending.get(Number(message.id))?.(message.result)
  }

  await clientTransport.start()
  await server.connect(serverTransport)

  async function request(id: number, method: string, params: Record<string, unknown>): Promise<unknown> {
    const answered = new Promise<unknown>(resolve => pending.set(id, resolve))
    await clientTransport.send({ jsonrpc: '2.0', id, method, params } as JSONRPCMessage)
    return answered
  }

  try {
    await request(1, 'initialize', {
      protocolVersion: LATEST_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'tools-list-budget', version: '0.0.0' },
    })
    await clientTransport.send({ jsonrpc: '2.0', method: 'notifications/initialized' } as JSONRPCMessage)
    return (await request(2, 'tools/list', {})) as ListToolsResult
  } finally {
    await clientTransport.close()
  }
}

/**
 * Printed only when a budget fails, so the failure says *which* tool grew
 * instead of only that the total did. Descriptions and the two schemas are
 * split out because they're the three things that move independently — and
 * in this server the schemas are by far the larger share.
 */
function breakdown(tools: Tool[]): string {
  const rows = tools
    .map(tool => ({
      name: tool.name,
      total: JSON.stringify(tool).length,
      description: JSON.stringify(tool.description ?? '').length,
      input: JSON.stringify(tool.inputSchema ?? {}).length,
      output: JSON.stringify(tool.outputSchema ?? {}).length,
    }))
    .sort((a, b) => b.total - a.total)

  return rows
    .map(r => `  ${r.name.padEnd(34)} total ${r.total}  (description ${r.description}, in ${r.input}, out ${r.output})`)
    .join('\n')
}

describe('tools/list context budget', () => {
  it.each(Object.keys(TOOLS_LIST_BUDGET) as McpConfig['profile'][])('%s profile stays within budget', async profile => {
    const budget = TOOLS_LIST_BUDGET[profile]
    const result = await fetchToolsList(profile)
    const bytes = JSON.stringify(result).length

    expect(
      result.tools.map(tool => tool.name),
      `The ${profile} profile no longer exposes ${budget.tools} tools. Adding or removing one changes what every ` +
        `conversation pays for — update TOOLS_LIST_BUDGET in its own commit, with the reason in the message.`
    ).toHaveLength(budget.tools)

    expect(
      bytes,
      `tools/list for the ${profile} profile is ${bytes} bytes, over its ${budget.bytes}-byte budget ` +
        `(see docs/conventions.md, "Context budget"). Per tool:\n${breakdown(result.tools)}`
    ).toBeLessThanOrEqual(budget.bytes)
  })
})
