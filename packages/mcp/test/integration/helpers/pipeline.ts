import type { CallToolResult, McpServer, ServerContext } from '@modelcontextprotocol/server'

import { createConfirmFn } from '../../../src/core/confirm'
import { createDedupFn } from '../../../src/core/idempotency'
import { registerTools, type ToolContext } from '../../../src/core/tool'

type RegisteredHandler = (args: unknown, serverCtx: ServerContext) => Promise<CallToolResult>

const fakeServerCtx = {} as ServerContext

/**
 * Drives a tool the way a real client does — through the registry pipeline,
 * with the real confirm and dedup strategies wired in. Confirmation and
 * deduplication are registry stages, so a test that calls `tool.handler`
 * directly proves nothing about either.
 *
 * Returns a `call(args)` function over a single freshly registered tool; each
 * call to this helper builds its own strategies, so one test's confirmation
 * trust and recorded outcomes never leak into another's.
 */
export function registerForCall(
  tool: Parameters<typeof registerTools>[0]['tools'][number],
  ctx: ToolContext
): (args: unknown) => Promise<CallToolResult> {
  const registered = new Map<string, RegisteredHandler>()
  const server = {
    registerTool: (name: string, _config: unknown, handler: RegisteredHandler) => {
      registered.set(name, handler)
    },
  } as unknown as McpServer

  registerTools({ server, tools: [tool], ctx, confirm: createConfirmFn(), dedup: createDedupFn() })
  const handler = registered.get(tool.name)!
  return (args: unknown) => handler(args, fakeServerCtx)
}

/** The text channel of a tool result, joined — what the model actually reads. */
export function resultText(result: CallToolResult): string {
  return (result.content as { type: string; text: string }[]).map(part => part.text).join('\n')
}
