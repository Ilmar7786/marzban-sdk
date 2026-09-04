import type { WsError } from '@/core/errors'

import type { ResolvedReconnectPolicy } from './reconnect-policy'

export type ReconnectVerdict = { retry: false } | { retry: true; delayMs: number }

export interface DecideReconnectInput {
  policy: ResolvedReconnectPolicy
  /** 1-based attempt about to run. */
  attempt: number
  /** Time (ms) spent reconnecting since the current drop. */
  elapsedMs: number
  /** The backoff delay `shouldReconnect` may accept as-is or override. */
  baseDelayMs: number
  /** Why the previous attempt — or the connection itself — failed. */
  error: WsError
}

/**
 * Folds the reconnect policy and the current attempt's circumstances into a
 * single verdict: stop, or retry after a delay.
 *
 * Doesn't know about the reconnect budget — that's a hard cap checked
 * separately by the caller (`LogStream`), unaffected by `shouldReconnect`.
 * The escape hatch for "never give up" is `maxElapsedMs: Infinity`, not a
 * `shouldReconnect` that can outlast the budget.
 */
export const decideReconnect = ({
  policy,
  attempt,
  elapsedMs,
  baseDelayMs,
  error,
}: DecideReconnectInput): ReconnectVerdict => {
  if (!policy.enabled) return { retry: false }
  if (!policy.shouldReconnect) return { retry: true, delayMs: baseDelayMs }

  const verdict = policy.shouldReconnect({ attempt, elapsedMs, error })

  if (verdict === false) return { retry: false }
  if (typeof verdict === 'number') return { retry: true, delayMs: verdict }
  // true or undefined (e.g. an implicit fallthrough return) both accept the computed backoff.
  return { retry: true, delayMs: baseDelayMs }
}
