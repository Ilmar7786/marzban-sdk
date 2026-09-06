import type { ListToolsResult, Tool } from '@modelcontextprotocol/server'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import type { MarzbanSDK } from 'marzban-sdk'
import { describe, expect, it, vi } from 'vitest'

import type { McpConfig } from '@/config'
import type { ToolContext } from '@/core/tool'

import { createMarzbanMcpServer } from './server'
import { connectInMemoryClient } from './testing/in-memory-client'

/**
 * The one suite that watches a `tools/call` from outside the server
 * (github.com/Ilmar7786/marzban-sdk#137). Every other test in this package
 * reads the `CallToolResult` a registered handler returns; a real client
 * never sees that object. It sees what survives the server SDK's output
 * validation and result projection, and it is free to use only part of what
 * survives — the freedom that made #137 invisible for a release.
 *
 * `tools-list-budget.test.ts` had the same vantage point but only ever asked
 * `tools/list`, so the call path was never exercised through the wire at all.
 */

const removeUser = vi.fn(async () => undefined)

function makeContext(confirm: McpConfig['confirm']): ToolContext {
  return {
    sdk: {
      user: { removeUser, getUser: async () => ({ status: 'active', used_traffic: 0, expire: 0 }) },
    } as unknown as MarzbanSDK,
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    config: {
      baseUrl: 'https://panel.example.com',
      username: 'admin',
      password: 'secret',
      profile: 'full',
      format: 'text',
      verbosity: 'compact',
      confirm,
      maxChars: 8000,
      logLevel: 'warn',
      showLinks: false,
    },
  }
}

/**
 * What reaches the model on a client that prefers `structuredContent`. The
 * spec lets such a client ignore `content` entirely for a successful result,
 * and Claude Desktop and Claude Code do. Kept as its own function so the
 * assertions below read as "what is a consumer guaranteed", not "what did we
 * happen to write where".
 */
function asSeenByStructuredClient(result: Record<string, unknown>): unknown {
  return result.isError === true || result.structuredContent === undefined ? result.content : result.structuredContent
}

/** The text channel, joined — the fallback channel, and where the first confirmation still lives. */
function contentText(result: Record<string, unknown>): string {
  return (result.content as { text: string }[]).map(part => part.text).join('\n')
}

/**
 * The same validator a strict MCP client applies to `structuredContent`, with
 * format assertions on — the shape #112 shipped past. Here it answers a
 * narrower question than in the integration suite: does what the client
 * *received* satisfy the schema the client was *told*? An output-side object
 * schema forbids additional properties, so a provenance field added to the
 * result but not to the advertised schema fails the whole result — which is
 * why the field is declared in `registeredOutputSchema` rather than merged in
 * at the end.
 */
const strictClientValidator = addFormats(new Ajv2020({ strict: false }))

function advertisedOutputSchema(list: ListToolsResult, name: string): Record<string, unknown> {
  return (list.tools as Tool[]).find(tool => tool.name === name)!.outputSchema as Record<string, unknown>
}

function callResult(response: Record<string, unknown>): Record<string, unknown> {
  // A failed output validation comes back as a JSON-RPC error, not a result —
  // surfacing it here makes that a readable failure instead of a crash on
  // `undefined`.
  expect(response.error, JSON.stringify(response.error)).toBeUndefined()
  return response.result as Record<string, unknown>
}

describe('tools/call over the wire', () => {
  it('a replayed destructive call is recognisable to a client that reads only structuredContent (#137)', async () => {
    removeUser.mockClear()
    const client = await connectInMemoryClient(
      // 'auto' is the default and the mode the bug was found in: the second
      // call is trusted, runs, and the third is replayed from the record.
      createMarzbanMcpServer({ name: 'marzban-mcp', version: '0.0.0' }, makeContext('auto'))
    )

    try {
      const declined = callResult(
        await client.request('tools/call', { name: 'marzban_users_delete', arguments: { username: 'alice' } })
      )
      expect(declined.isError).toBe(true)
      const token = contentText(declined).match(/confirmToken: "([^"]+)"/)![1]

      const executed = callResult(
        await client.request('tools/call', {
          name: 'marzban_users_delete',
          arguments: { username: 'alice', confirmToken: token },
        })
      )
      expect(removeUser).toHaveBeenCalledTimes(1)
      expect(executed.structuredContent).toMatchObject({ _execution: { status: 'executed' } })

      // The retry a timing-out client sends: same arguments, no token.
      const replayed = callResult(
        await client.request('tools/call', { name: 'marzban_users_delete', arguments: { username: 'alice' } })
      )

      // The panel was not asked again — that part always worked.
      expect(removeUser).toHaveBeenCalledTimes(1)
      // What did not: the model was never told. Assert through the projection
      // a real client applies, not on the result object as a whole.
      const seen = JSON.stringify(asSeenByStructuredClient(replayed))
      expect(seen).toContain('already ran')
      expect(seen).toContain('nothing was sent to the panel just now')
      expect(seen).toContain('confirmToken')
      // The recorded answer is still there, unchanged, for the client that
      // was retrying because it never saw the first one.
      expect(replayed.structuredContent).toMatchObject({ username: 'alice', deleted: true })

      // …and both results satisfy the schema this same server advertised for
      // the tool, provenance field included.
      const list = (await client.request('tools/list', {})).result as ListToolsResult
      const validate = strictClientValidator.compile(advertisedOutputSchema(list, 'marzban_users_delete'))
      for (const result of [executed, replayed]) {
        expect(validate(result.structuredContent) || validate.errors).toBe(true)
      }
    } finally {
      await client.close()
    }
  })
})
