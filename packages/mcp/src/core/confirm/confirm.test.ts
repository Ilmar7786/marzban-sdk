import type { ServerContext } from '@modelcontextprotocol/server'
import type { MarzbanSDK } from 'marzban-sdk'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { McpConfig } from '@/config'
import type { View } from '@/format/views/types'

import { defineTool, type ToolContext } from '../tool'
import { createConfirmFn } from './confirm'

const fakeServerCtx = {} as ServerContext

const echoView: View<{ ok: boolean }> = { compact: data => ({ ok: data.ok }) }

function makeTool(overrides: Partial<Parameters<typeof defineTool<z.ZodType, z.ZodType>>[0]> = {}) {
  return defineTool({
    name: 'marzban_test_destructive',
    title: 'Destructive test tool',
    description: 'A tool used only in tests.',
    inputSchema: z.object({ username: z.string().optional(), confirmToken: z.string().optional() }),
    outputSchema: z.object({ ok: z.boolean() }),
    scope: 'destructive',
    view: echoView,
    handler: async () => ({ ok: true }),
    ...overrides,
  })
}

function makeContext(confirm: McpConfig['confirm'] = 'auto'): ToolContext {
  return {
    sdk: {} as MarzbanSDK,
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

describe('createConfirmFn', () => {
  it('off: proceeds immediately without minting a token', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool()
    const ctx = makeContext('off')
    const decision = await confirm({ tool, args: { username: 'alice' }, ctx, serverCtx: fakeServerCtx })
    expect(decision).toEqual({ proceed: true, reason: 'off' })
  })

  it('first call with no confirmToken asks for confirmation and includes a token in the message', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool()
    const ctx = makeContext('auto')
    const decision = await confirm({ tool, args: { username: 'alice' }, ctx, serverCtx: fakeServerCtx })
    expect(decision.proceed).toBe(false)
    expect(decision.message).toContain('confirmToken:')
    expect(decision.message).toContain('Destructive test tool')
  })

  it('uses the tool-provided describeConsequences text when present', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool({ describeConsequences: () => 'Custom consequence text.' })
    const ctx = makeContext('auto')
    const decision = await confirm({ tool, args: { username: 'alice' }, ctx, serverCtx: fakeServerCtx })
    expect(decision.message).toContain('Custom consequence text.')
  })

  it('supports an async describeConsequences', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool({ describeConsequences: async () => 'Async consequence text.' })
    const ctx = makeContext('auto')
    const decision = await confirm({ tool, args: { username: 'alice' }, ctx, serverCtx: fakeServerCtx })
    expect(decision.message).toContain('Async consequence text.')
  })

  it('a valid confirmToken from the first call lets the second call proceed', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool()
    const ctx = makeContext('always')
    const args = { username: 'alice' }

    const first = await confirm({ tool, args, ctx, serverCtx: fakeServerCtx })
    expect(first.proceed).toBe(false)
    const token = first.message!.match(/confirmToken: "([^"]+)"/)![1]

    const second = await confirm({ tool, args: { ...args, confirmToken: token }, ctx, serverCtx: fakeServerCtx })
    // `reason: 'token'` — a human approved this exact call moments ago, which
    // is what lets core/idempotency run it rather than replay a record.
    expect(second).toEqual({ proceed: true, reason: 'token' })
  })

  it('an invalid confirmToken is rejected, logged, and a fresh confirmation is requested', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool()
    const ctx = makeContext('always')
    const args = { username: 'alice', confirmToken: 'not-a-real-token' }

    const decision = await confirm({ tool, args, ctx, serverCtx: fakeServerCtx })
    expect(decision.proceed).toBe(false)
    expect(ctx.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Rejected confirmToken'))
  })

  it('auto: a confirmed call does not authorize the same tool with different arguments', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool()
    const ctx = makeContext('auto')
    const args = { username: 'alice' }

    const first = await confirm({ tool, args, ctx, serverCtx: fakeServerCtx })
    const token = first.message!.match(/confirmToken: "([^"]+)"/)![1]
    await confirm({ tool, args: { ...args, confirmToken: token }, ctx, serverCtx: fakeServerCtx })

    const third = await confirm({ tool, args: { username: 'bob' }, ctx, serverCtx: fakeServerCtx })
    expect(third.proceed).toBe(false)
  })

  it('auto: a confirmed call does not authorize a wider version of the same call', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool({
      inputSchema: z.object({ all: z.boolean().optional(), confirmToken: z.string().optional() }),
    })
    const ctx = makeContext('auto')
    const args = { all: false }

    const first = await confirm({ tool, args, ctx, serverCtx: fakeServerCtx })
    const token = first.message!.match(/confirmToken: "([^"]+)"/)![1]
    await confirm({ tool, args: { ...args, confirmToken: token }, ctx, serverCtx: fakeServerCtx })

    const wider = await confirm({ tool, args: { all: true }, ctx, serverCtx: fakeServerCtx })
    expect(wider.proceed).toBe(false)
  })

  it('auto: a confirmed call proceeds again with the same arguments, within the TTL', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool()
    const ctx = makeContext('auto')
    const args = { username: 'alice' }

    const first = await confirm({ tool, args, ctx, serverCtx: fakeServerCtx })
    const token = first.message!.match(/confirmToken: "([^"]+)"/)![1]
    await confirm({ tool, args: { ...args, confirmToken: token }, ctx, serverCtx: fakeServerCtx })

    const again = await confirm({ tool, args, ctx, serverCtx: fakeServerCtx })
    expect(again).toEqual({ proceed: true, reason: 'trusted' })
    expect(ctx.logger.info).toHaveBeenCalledWith(expect.stringContaining('accumulated confirm trust'))
  })

  it('auto: trust for the same arguments expires after the confirm-token TTL', async () => {
    vi.useFakeTimers()
    try {
      const confirm = createConfirmFn()
      const tool = makeTool()
      const ctx = makeContext('auto')
      const args = { username: 'alice' }

      const first = await confirm({ tool, args, ctx, serverCtx: fakeServerCtx })
      const token = first.message!.match(/confirmToken: "([^"]+)"/)![1]
      await confirm({ tool, args: { ...args, confirmToken: token }, ctx, serverCtx: fakeServerCtx })

      vi.advanceTimersByTime(301_000)

      const again = await confirm({ tool, args, ctx, serverCtx: fakeServerCtx })
      expect(again.proceed).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('always: never trusts the tool, so every call needs its own confirmation', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool()
    const ctx = makeContext('always')
    const args = { username: 'alice' }

    const first = await confirm({ tool, args, ctx, serverCtx: fakeServerCtx })
    const token = first.message!.match(/confirmToken: "([^"]+)"/)![1]
    await confirm({ tool, args: { ...args, confirmToken: token }, ctx, serverCtx: fakeServerCtx })

    const third = await confirm({ tool, args: { username: 'bob' }, ctx, serverCtx: fakeServerCtx })
    expect(third.proceed).toBe(false)
  })

  it('treats a non-string confirmToken the same as no token', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool()
    const ctx = makeContext('auto')
    const decision = await confirm({
      tool,
      args: { username: 'alice', confirmToken: 42 },
      ctx,
      serverCtx: fakeServerCtx,
    })
    expect(decision.proceed).toBe(false)
  })

  it('treats an empty-string confirmToken the same as no token', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool()
    const ctx = makeContext('auto')
    const decision = await confirm({
      tool,
      args: { username: 'alice', confirmToken: '' },
      ctx,
      serverCtx: fakeServerCtx,
    })
    expect(decision.proceed).toBe(false)
  })

  it('handles non-object args without throwing', async () => {
    const confirm = createConfirmFn()
    const tool = makeTool()
    const ctx = makeContext('auto')
    const decision = await confirm({ tool, args: undefined, ctx, serverCtx: fakeServerCtx })
    expect(decision.proceed).toBe(false)
  })
})
