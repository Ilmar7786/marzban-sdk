import type { CallToolResult, McpServer, ServerContext } from '@modelcontextprotocol/server'
import type { MarzbanSDK } from 'marzban-sdk'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { McpConfig } from '@/config'
import type { View } from '@/format/views/types'

import type { ToolContext } from './context'
import { defineTool } from './define-tool'
import { ToolError } from './errors'
import { alwaysProceed, type ConfirmFn, registerTools, selectTools } from './registry'

type RegisteredEntry = {
  config: { title?: string; description?: string; annotations?: Record<string, unknown> }
  handler: (args: unknown, serverCtx: ServerContext) => Promise<CallToolResult>
}

function createFakeServer() {
  const registered = new Map<string, RegisteredEntry>()
  const server = {
    registerTool: (name: string, config: RegisteredEntry['config'], handler: RegisteredEntry['handler']) => {
      registered.set(name, { config, handler })
    },
  }
  return { server: server as unknown as McpServer, registered }
}

const echoView: View<{ echoed: string }> = {
  compact: data => ({ echoed: data.echoed }),
}

function makeTool(overrides: Partial<Parameters<typeof defineTool<z.ZodType, z.ZodType>>[0]> = {}) {
  return defineTool({
    name: 'marzban_test_tool',
    title: 'Test tool',
    description: 'A tool used only in tests.',
    inputSchema: z.object({ value: z.string() }),
    outputSchema: z.object({ echoed: z.string() }),
    scope: 'read',
    view: echoView,
    handler: async args => ({ echoed: (args as { value: string }).value }),
    ...overrides,
  })
}

function makeConfig(overrides: Partial<McpConfig> = {}): McpConfig {
  return {
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
  }
}

function makeContext(configOverrides: Partial<McpConfig> = {}): ToolContext {
  return {
    sdk: {} as MarzbanSDK,
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    config: makeConfig(configOverrides),
  }
}

const fakeServerCtx = {} as ServerContext

describe('selectTools', () => {
  const readTool = makeTool({ name: 'marzban_a_read', scope: 'read' })
  const writeTool = makeTool({ name: 'marzban_b_write', scope: 'write' })
  const destructiveTool = makeTool({ name: 'marzban_c_destructive', scope: 'destructive' })
  const tools = [destructiveTool, writeTool, readTool]

  it('readonly profile keeps only read-scope tools', () => {
    const selected = selectTools(tools, { profile: 'readonly' })
    expect(selected.map(t => t.name)).toEqual(['marzban_a_read'])
  })

  it('standard profile keeps read + write, not destructive', () => {
    const selected = selectTools(tools, { profile: 'standard' })
    expect(selected.map(t => t.name)).toEqual(['marzban_a_read', 'marzban_b_write'])
  })

  it('full profile keeps everything', () => {
    const selected = selectTools(tools, { profile: 'full' })
    expect(selected.map(t => t.name)).toEqual(['marzban_a_read', 'marzban_b_write', 'marzban_c_destructive'])
  })

  it('sorts the result by name regardless of input order', () => {
    const selected = selectTools([writeTool, readTool], { profile: 'standard' })
    expect(selected.map(t => t.name)).toEqual(['marzban_a_read', 'marzban_b_write'])
  })

  it('deny excludes a matching tool even when profile allows it', () => {
    const selected = selectTools(tools, { profile: 'full', toolsDeny: ['marzban_c_*'] })
    expect(selected.map(t => t.name)).toEqual(['marzban_a_read', 'marzban_b_write'])
  })

  it('allow narrows the result to only matching tools', () => {
    const selected = selectTools(tools, { profile: 'full', toolsAllow: ['marzban_a_*'] })
    expect(selected.map(t => t.name)).toEqual(['marzban_a_read'])
  })

  it('deny wins over allow for the same tool', () => {
    const selected = selectTools(tools, {
      profile: 'full',
      toolsAllow: ['marzban_a_*'],
      toolsDeny: ['marzban_a_*'],
    })
    expect(selected).toEqual([])
  })

  it('an allow pattern with no matches yields an empty result', () => {
    const selected = selectTools(tools, { profile: 'full', toolsAllow: ['nothing_matches_*'] })
    expect(selected).toEqual([])
  })
})

describe('registerTools', () => {
  it('registers the profile-filtered tools and derives readOnlyHint/destructiveHint from scope', () => {
    const { server, registered } = createFakeServer()
    const readTool = makeTool({ name: 'marzban_read_one', scope: 'read' })
    const destructiveTool = makeTool({ name: 'marzban_destroy_one', scope: 'destructive' })

    const selected = registerTools({
      server,
      tools: [readTool, destructiveTool],
      ctx: makeContext({ profile: 'standard' }),
      confirm: alwaysProceed,
    })

    expect(selected.map(t => t.name)).toEqual(['marzban_read_one'])
    expect(registered.has('marzban_destroy_one')).toBe(false)
    const entry = registered.get('marzban_read_one')!
    expect(entry.config.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false })
  })

  it('merges author-supplied idempotentHint/openWorldHint on top of the derived hints', () => {
    const { server, registered } = createFakeServer()
    const tool = makeTool({ annotations: { idempotentHint: true, openWorldHint: false } })

    registerTools({ server, tools: [tool], ctx: makeContext(), confirm: alwaysProceed })

    expect(registered.get('marzban_test_tool')!.config.annotations).toMatchObject({
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    })
  })

  it('calls the handler and renders its data per the configured format/verbosity', async () => {
    const { server, registered } = createFakeServer()
    const tool = makeTool()

    registerTools({ server, tools: [tool], ctx: makeContext({ format: 'json' }), confirm: alwaysProceed })

    const result = await registered.get('marzban_test_tool')!.handler({ value: 'hi' }, fakeServerCtx)
    expect(result.content).toEqual([{ type: 'text', text: '{"echoed":"hi"}' }])
    expect(result.structuredContent).toEqual({ echoed: 'hi' })
  })

  it('never calls confirm for a read-scope tool', async () => {
    const { server, registered } = createFakeServer()
    const confirm = vi.fn<ConfirmFn>(() => ({ proceed: true }))
    registerTools({ server, tools: [makeTool({ scope: 'read' })], ctx: makeContext(), confirm })

    await registered.get('marzban_test_tool')!.handler({ value: 'hi' }, fakeServerCtx)
    expect(confirm).not.toHaveBeenCalled()
  })

  it('calls confirm for a destructive-scope tool and proceeds when confirmed', async () => {
    const { server, registered } = createFakeServer()
    const confirm = vi.fn<ConfirmFn>(() => ({ proceed: true }))
    registerTools({
      server,
      tools: [makeTool({ scope: 'destructive' })],
      ctx: makeContext({ profile: 'full' }),
      confirm,
    })

    const result = await registered.get('marzban_test_tool')!.handler({ value: 'hi' }, fakeServerCtx)
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(result.isError).toBeFalsy()
    expect(result.structuredContent).toEqual({ echoed: 'hi' })
  })

  it('short-circuits without calling the handler when confirm declines', async () => {
    const { server, registered } = createFakeServer()
    const handler = vi.fn(async () => ({ echoed: 'should not run' }))
    const confirm = vi.fn<ConfirmFn>(() => ({ proceed: false, message: 'Not yet — confirm first.' }))
    registerTools({
      server,
      tools: [makeTool({ scope: 'destructive', handler })],
      ctx: makeContext({ profile: 'full' }),
      confirm,
    })

    const result = await registered.get('marzban_test_tool')!.handler({ value: 'hi' }, fakeServerCtx)
    expect(handler).not.toHaveBeenCalled()
    // isError: true (not false) — the tool declares an outputSchema, and the
    // SDK requires structuredContent on every non-error result that has one.
    expect(result).toEqual({ content: [{ type: 'text', text: 'Not yet — confirm first.' }], isError: true })
  })

  it('falls back to a generic message when confirm declines without one', async () => {
    const { server, registered } = createFakeServer()
    const confirm = vi.fn<ConfirmFn>(() => ({ proceed: false }))
    registerTools({
      server,
      tools: [makeTool({ scope: 'destructive' })],
      ctx: makeContext({ profile: 'full' }),
      confirm,
    })

    const result = await registered.get('marzban_test_tool')!.handler({ value: 'hi' }, fakeServerCtx)
    expect(result).toEqual({ content: [{ type: 'text', text: 'Confirmation required.' }], isError: true })
  })

  it("skips confirm entirely when the tool's skipConfirm returns true for these args", async () => {
    const { server, registered } = createFakeServer()
    const confirm = vi.fn<ConfirmFn>(() => ({ proceed: false, message: 'should not be seen' }))
    const skipConfirm = vi.fn((args: unknown) => (args as { value: string }).value === 'skip')
    registerTools({
      server,
      tools: [makeTool({ scope: 'destructive', skipConfirm })],
      ctx: makeContext({ profile: 'full' }),
      confirm,
    })

    const result = await registered.get('marzban_test_tool')!.handler({ value: 'skip' }, fakeServerCtx)
    expect(confirm).not.toHaveBeenCalled()
    expect(result.structuredContent).toEqual({ echoed: 'skip' })
  })

  it('still calls confirm when skipConfirm returns false for these args', async () => {
    const { server, registered } = createFakeServer()
    const confirm = vi.fn<ConfirmFn>(() => ({ proceed: true }))
    const skipConfirm = vi.fn(() => false)
    registerTools({
      server,
      tools: [makeTool({ scope: 'destructive', skipConfirm })],
      ctx: makeContext({ profile: 'full' }),
      confirm,
    })

    await registered.get('marzban_test_tool')!.handler({ value: 'hi' }, fakeServerCtx)
    expect(confirm).toHaveBeenCalledTimes(1)
  })

  it('maps a thrown ToolError to an isError result instead of throwing', async () => {
    const { server, registered } = createFakeServer()
    const tool = makeTool({
      handler: async () => {
        throw new ToolError('INTERNAL_ERROR', 'handler failed')
      },
    })
    registerTools({ server, tools: [tool], ctx: makeContext(), confirm: alwaysProceed })

    const result = await registered.get('marzban_test_tool')!.handler({ value: 'hi' }, fakeServerCtx)
    expect(result.isError).toBe(true)
    expect(result.content).toEqual([{ type: 'text', text: 'handler failed' }])
  })

  it('returns the same tools it registered', () => {
    const { server } = createFakeServer()
    const tool = makeTool()
    const selected = registerTools({ server, tools: [tool], ctx: makeContext(), confirm: alwaysProceed })
    expect(selected).toEqual([tool])
  })
})

describe('alwaysProceed', () => {
  it('always resolves to proceed: true', () => {
    expect(alwaysProceed({ tool: makeTool(), args: {}, ctx: makeContext(), serverCtx: fakeServerCtx })).toEqual({
      proceed: true,
    })
  })
})
