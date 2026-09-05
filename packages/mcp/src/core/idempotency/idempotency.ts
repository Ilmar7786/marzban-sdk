import { createTtlMap } from '@/shared/ttl-map'

import { callKey } from '../confirm'
import type { DedupFn, DedupOutcome } from '../tool'
import { classifyFailure } from './classify'

/**
 * How long a completed destructive call is remembered. Deliberately its own
 * constant rather than a reuse of `CONFIRM_TOKEN_TTL_SECONDS`: the two windows
 * answer different questions — a confirmation window is about how recently a
 * human agreed, this one is about how long a client might plausibly still be
 * retrying — and they should be free to diverge without one silently dragging
 * the other along.
 */
export const IDEMPOTENCY_TTL_SECONDS = 300

/**
 * Cap on remembered calls. A recorded `marzban_config_update` carries the
 * whole previous Xray config in `backup` — tens of kilobytes — and this
 * process lives for days, so an unbounded store is a slow leak in the shape
 * of a loop over ten thousand usernames.
 */
const MAX_ENTRIES = 256

type DedupRecord =
  | { status: 'pending'; promise: Promise<unknown>; at: number }
  | { status: 'done'; data: unknown; at: number }
  | { status: 'unknown'; at: number }

function secondsLeft(recordedAt: number, now: number): number {
  return Math.max(0, Math.ceil((recordedAt + IDEMPOTENCY_TTL_SECONDS * 1000 - now) / 1000))
}

function replayNotice(toolName: string, firstRunAt: number, now: number): string {
  const ago = Math.max(0, Math.round((now - firstRunAt) / 1000))
  return [
    `NOTE: "${toolName}" already ran ${ago}s ago with these exact arguments.`,
    'This is the recorded result of that call, not a new execution — nothing was sent to the panel just now.',
    `To run it again for real, confirm it afresh, or wait ${secondsLeft(firstRunAt, now)}s for this record to expire.`,
  ].join(' ')
}

function unknownMessage(toolName: string, recordedAt: number, now: number): string {
  return [
    `A previous call to "${toolName}" with these exact arguments was interrupted before its outcome could be observed —`,
    'the panel may or may not have applied it.',
    'Do NOT repeat this call.',
    'Check the current state with a read-only tool first and report what you find to the user.',
    `This call will be accepted again in ${secondsLeft(recordedAt, now)}s.`,
  ].join(' ')
}

/**
 * Builds the deduplication strategy for destructive tools (issue #76). One
 * instance owns one store, scoped to the server instance's lifetime — a fresh
 * `createMarzbanMcpServer()` starts with an empty one, the same policy the
 * confirm signing key follows.
 *
 * The problem it solves sits one layer above the SDK: the SDK no longer
 * replays an unsafe request (#75), but a client that times out waiting for
 * `tools/call` re-issues the call, and the second one would restart the core
 * or overwrite the config all over again. Keyed by `callKey`, so a repeat is
 * "the same tool, the same arguments" — `confirmToken` is excluded from the
 * hash, which is what makes a retry carrying a token match the original call.
 *
 * Note for future changes: the single-flight branch assumes cancellation by
 * one caller cannot abort a shared in-flight operation. That holds because
 * handlers receive only `ToolContext` and no `AbortSignal` is wired into SDK
 * calls. If `serverCtx.mcpReq.signal` is ever plumbed through, cancelling the
 * first call would abort the second caller's operation too, and the abort
 * would have to be keyed to "every waiter has gone" instead.
 *
 * The store is also per-process and per-server-instance, which is sound only
 * while the transport is stdio (one client per process). An HTTP transport
 * would need `sessionId` folded into the key, or a per-session store.
 */
export function createDedupFn(): DedupFn {
  const records = createTtlMap<DedupRecord>({ maxEntries: MAX_ENTRIES })

  return async function dedup({ tool, args, bypass, run }): Promise<DedupOutcome> {
    const key = callKey(tool.name, args)

    // A freshly verified confirm token means a human just re-approved this
    // exact operation, which is an explicit "yes, run it again" — the one
    // thing that outranks a recorded outcome. An accidental retry can't reach
    // here: it re-sends the already-consumed token, which fails verification.
    if (bypass) records.delete(key)

    const existing = records.get(key)

    if (existing?.status === 'pending') {
      // Single-flight: the answer is seconds away and will be exact, so wait
      // for it rather than telling the model "unknown" about something we are
      // about to be told. If the shared run fails, both callers see the same
      // failure.
      const data = await existing.promise
      return { kind: 'replayed', data, notice: replayNotice(tool.name, existing.at, Date.now()) }
    }
    if (existing?.status === 'done') {
      return { kind: 'replayed', data: existing.data, notice: replayNotice(tool.name, existing.at, Date.now()) }
    }
    if (existing?.status === 'unknown') {
      return { kind: 'unknown', message: unknownMessage(tool.name, existing.at, Date.now()) }
    }

    const startedAt = Date.now()
    const promise = run()
    // The stored reference needs its own no-op handler: a rejected promise
    // sitting in a map with nothing attached is an unhandled rejection, and
    // the caller below attaches to its own reference, not to this one.
    promise.catch(() => {})
    records.set(key, { status: 'pending', promise, at: startedAt }, IDEMPOTENCY_TTL_SECONDS * 1000)

    try {
      const data = await promise
      records.set(key, { status: 'done', data, at: Date.now() }, IDEMPOTENCY_TTL_SECONDS * 1000)
      return { kind: 'executed', data }
    } catch (err) {
      if (classifyFailure(err) === 'unknown') {
        records.set(key, { status: 'unknown', at: Date.now() }, IDEMPOTENCY_TTL_SECONDS * 1000)
      } else {
        records.delete(key)
      }
      // The caller that hit the failure gets the real error; only a later,
      // identical call gets the "verify the state" steer.
      throw err
    }
  }
}
