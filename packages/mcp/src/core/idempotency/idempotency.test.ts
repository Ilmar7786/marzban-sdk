import { HttpError } from 'marzban-sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { McpConfig } from '@/config'
import type { View } from '@/format/views/types'

import { defineTool, type ToolContext, type ToolDefinition } from '../tool'
import { createDedupFn } from './idempotency'

const echoView: View<{ echoed: string }> = { compact: data => [data] }

function makeTool(name = 'marzban_test_destroy'): ToolDefinition<z.ZodType, z.ZodType> {
  return defineTool({
    name,
    title: 'Test',
    description: 'Test tool',
    inputSchema: z.object({ value: z.string() }),
    outputSchema: z.object({ echoed: z.string() }),
    scope: 'destructive',
    view: echoView,
    handler: async () => ({ echoed: 'hi' }),
  }) as unknown as ToolDefinition<z.ZodType, z.ZodType>
}

const ctx: ToolContext = {
  sdk: {} as ToolContext['sdk'],
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  config: {} as McpConfig,
}

function call(overrides: { tool?: ToolDefinition<z.ZodType, z.ZodType>; args?: unknown; bypass?: boolean } = {}) {
  return {
    tool: overrides.tool ?? makeTool(),
    args: overrides.args ?? { username: 'alice' },
    ctx,
    bypass: overrides.bypass ?? false,
  }
}

/** An unanswered POST — the only error shape that leaves the panel's state unknown. */
function unansweredWrite() {
  return new HttpError({ config: { method: 'post' } })
}

describe('createDedupFn', () => {
  it('runs the operation the first time it sees a call', async () => {
    const dedup = createDedupFn()
    const run = vi.fn(async () => ({ deleted: true }))

    const outcome = await dedup({ ...call(), run })

    expect(run).toHaveBeenCalledTimes(1)
    expect(outcome).toEqual({ kind: 'executed', data: { deleted: true } })
  })

  it('replays the recorded result for an identical repeat, without running anything', async () => {
    const dedup = createDedupFn()
    const run = vi.fn(async () => ({ deleted: true }))

    await dedup({ ...call(), run })
    const outcome = await dedup({ ...call(), run })

    expect(run).toHaveBeenCalledTimes(1)
    expect(outcome.kind).toBe('replayed')
    expect(outcome).toMatchObject({ data: { deleted: true } })
  })

  it('names the tool and says nothing was sent when it replays', async () => {
    const dedup = createDedupFn()
    const run = vi.fn(async () => ({ deleted: true }))

    await dedup({ ...call(), run })
    const outcome = await dedup({ ...call(), run })

    expect(outcome.kind === 'replayed' && outcome.notice).toContain('marzban_test_destroy')
    expect(outcome.kind === 'replayed' && outcome.notice).toContain('not a new execution')
  })

  it('matches a retry that carries a confirmToken to the original call', async () => {
    const dedup = createDedupFn()
    const run = vi.fn(async () => ({ deleted: true }))

    await dedup({ ...call({ args: { username: 'alice' } }), run })
    const outcome = await dedup({ ...call({ args: { username: 'alice', confirmToken: 'v1.abc' } }), run })

    expect(run).toHaveBeenCalledTimes(1)
    expect(outcome.kind).toBe('replayed')
  })

  it('runs again for different arguments', async () => {
    const dedup = createDedupFn()
    const run = vi.fn(async () => ({ deleted: true }))

    await dedup({ ...call({ args: { username: 'alice' } }), run })
    await dedup({ ...call({ args: { username: 'bob' } }), run })

    expect(run).toHaveBeenCalledTimes(2)
  })

  it('runs again for the same arguments on a different tool', async () => {
    const dedup = createDedupFn()
    const run = vi.fn(async () => ({ deleted: true }))

    await dedup({ ...call({ tool: makeTool('marzban_test_destroy') }), run })
    await dedup({ ...call({ tool: makeTool('marzban_test_other') }), run })

    expect(run).toHaveBeenCalledTimes(2)
  })

  describe('the record expires', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('runs again once the window has passed', async () => {
      const dedup = createDedupFn()
      const run = vi.fn(async () => ({ deleted: true }))

      await dedup({ ...call(), run })
      vi.advanceTimersByTime(301_000)
      const outcome = await dedup({ ...call(), run })

      expect(run).toHaveBeenCalledTimes(2)
      expect(outcome.kind).toBe('executed')
    })

    it('accepts an interrupted call again once its window has passed', async () => {
      const dedup = createDedupFn()
      const run = vi.fn(async () => {
        throw unansweredWrite()
      })

      await expect(dedup({ ...call(), run })).rejects.toThrow()
      vi.advanceTimersByTime(301_000)
      const outcome = await dedup({ ...call(), run: async () => ({ deleted: true }) })

      expect(outcome.kind).toBe('executed')
    })
  })

  describe('when the operation fails', () => {
    it('reports a failure the panel answered as a plain error and stays retryable', async () => {
      const dedup = createDedupFn()
      const answered = new HttpError({ response: { status: 409 }, config: { method: 'post' } })
      const run = vi.fn(async () => {
        throw answered
      })

      await expect(dedup({ ...call(), run })).rejects.toBe(answered)
      await expect(dedup({ ...call(), run })).rejects.toBe(answered)
      expect(run).toHaveBeenCalledTimes(2)
    })

    it('gives the caller who hit the interruption the real error, not a steer', async () => {
      const dedup = createDedupFn()
      const interrupted = unansweredWrite()
      const run = vi.fn(async () => {
        throw interrupted
      })

      await expect(dedup({ ...call(), run })).rejects.toBe(interrupted)
    })

    it('tells the next identical call the outcome is unknown, and does not run it', async () => {
      const dedup = createDedupFn()
      const run = vi.fn(async () => {
        throw unansweredWrite()
      })

      await expect(dedup({ ...call(), run })).rejects.toThrow()
      const outcome = await dedup({ ...call(), run })

      expect(run).toHaveBeenCalledTimes(1)
      expect(outcome.kind).toBe('unknown')
      expect(outcome.kind === 'unknown' && outcome.message).toContain('read-only tool')
      expect(outcome.kind === 'unknown' && outcome.message).toContain('Do NOT repeat this call')
    })
  })

  describe('when two identical calls overlap', () => {
    it('runs the operation once and gives both callers the same data', async () => {
      const dedup = createDedupFn()
      let release: (value: { deleted: boolean }) => void = () => {}
      const run = vi.fn(() => new Promise<{ deleted: boolean }>(resolve => (release = resolve)))

      const first = dedup({ ...call(), run })
      const second = dedup({ ...call(), run })
      release({ deleted: true })

      expect(await first).toEqual({ kind: 'executed', data: { deleted: true } })
      expect(await second).toMatchObject({ kind: 'replayed', data: { deleted: true } })
      expect(run).toHaveBeenCalledTimes(1)
    })

    it('fails both callers when the shared operation fails, and stays retryable afterwards', async () => {
      const dedup = createDedupFn()
      const answered = new HttpError({ response: { status: 409 }, config: { method: 'post' } })
      let reject: (reason: unknown) => void = () => {}
      const run = vi.fn(() => new Promise<{ deleted: boolean }>((_, r) => (reject = r)))

      const first = dedup({ ...call(), run })
      const second = dedup({ ...call(), run })
      reject(answered)

      await expect(first).rejects.toBe(answered)
      await expect(second).rejects.toBe(answered)

      const outcome = await dedup({ ...call(), run: async () => ({ deleted: true }) })
      expect(outcome.kind).toBe('executed')
    })
  })

  describe('bypass', () => {
    it('runs a recorded call again when a fresh confirmation says to', async () => {
      const dedup = createDedupFn()
      const run = vi.fn(async () => ({ deleted: true }))

      await dedup({ ...call(), run })
      const outcome = await dedup({ ...call({ bypass: true }), run })

      expect(run).toHaveBeenCalledTimes(2)
      expect(outcome.kind).toBe('executed')
    })

    it('clears an unknown outcome too', async () => {
      const dedup = createDedupFn()
      const failing = vi.fn(async () => {
        throw unansweredWrite()
      })

      await expect(dedup({ ...call(), run: failing })).rejects.toThrow()
      const outcome = await dedup({ ...call({ bypass: true }), run: async () => ({ deleted: true }) })

      expect(outcome).toEqual({ kind: 'executed', data: { deleted: true } })
    })
  })
})
