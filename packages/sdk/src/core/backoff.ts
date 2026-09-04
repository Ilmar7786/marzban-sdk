export interface BackoffOptions {
  /** Base delay (ms) for attempt 1. */
  baseMs: number
  /** Upper bound (ms) any attempt's delay is capped at, before jitter is applied. */
  maxMs: number
  /**
   * Randomizes the capped delay to somewhere in its upper half ("equal
   * jitter") instead of returning it as-is — so many clients backing off in
   * lockstep don't retry in sync, without ever degrading into a near-zero-delay
   * hot loop the way "full jitter" (random between 0 and the cap) can.
   * Defaults to `false`.
   */
  jitter?: boolean
}

/**
 * Exponential backoff delay (ms) for a 1-based attempt number:
 * `baseMs * 2^(attempt-1)`, capped at `maxMs`.
 *
 * Shared by the HTTP retry layer (`core/http/client.ts`, `jitter: false` —
 * preserves its deterministic 1s/2s/4s/8s/.../30s schedule) and the WS
 * reconnect state machine (`core/ws`, `jitter: true`).
 */
export function computeBackoff(attempt: number, { baseMs, maxMs, jitter = false }: BackoffOptions): number {
  const capped = Math.min(2 ** (attempt - 1) * baseMs, maxMs)
  if (!jitter) return capped

  const half = capped / 2
  return half + Math.random() * half
}
