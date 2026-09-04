import { z } from 'zod/v4'

import { WsError, WsOptionsError } from '@/core/errors'

import type { LogStreamTuning } from '../log-stream'

/** Passed to `shouldReconnect` before each reconnect attempt (including the first, when `initial` is set). */
export interface ShouldReconnectContext {
  /** 1-based attempt about to run. */
  attempt: number
  /** Time (ms) spent reconnecting since the current drop. */
  elapsedMs: number
  /** Why the previous attempt — or the connection itself — failed. */
  error: WsError
}

export interface ReconnectOptions {
  /**
   * Also retries a failed *first* connect instead of rejecting `connect*()`
   * immediately. Default `false` — ADR-0016's default is that a first
   * handshake failure (surviving one re-auth retry) fails loudly, since a
   * misconfigured `baseUrl` or a panel that's down should not hang silently.
   */
  initial?: boolean
  /** Total downtime budget (ms) before giving up. `Infinity` disables the budget — retries forever. */
  maxElapsedMs?: number
  /** How long a reconnected stream must stay open before backoff and the budget reset. */
  stableAfterMs?: number
  /** Base exponential-backoff delay (ms). */
  minDelayMs?: number
  /** Backoff delay cap (ms). */
  maxDelayMs?: number
  /**
   * Full custom control over whether — and how long — to wait before the
   * next attempt. `false` stops reconnecting; `true` or `undefined` accepts
   * the computed backoff delay; a `number` overrides it.
   */
  shouldReconnect?: (ctx: ShouldReconnectContext) => boolean | number | undefined
}

/** `false` disables reconnecting entirely; `true` or an options object enables it, with any explicit overrides. */
export type ReconnectOption = boolean | ReconnectOptions

const reconnectOptionsSchema = z
  .object({
    initial: z.boolean().optional(),
    // zod/v4's z.number() rejects Infinity outright — it has to be allowed explicitly.
    maxElapsedMs: z.union([z.number().positive(), z.literal(Infinity)]).optional(),
    stableAfterMs: z.number().positive().optional(),
    minDelayMs: z.number().positive().optional(),
    maxDelayMs: z.number().positive().optional(),
    // zod/v4 has no schema for validating a plain function value as a field
    // (z.function() builds a call/return contract, not a value validator).
    shouldReconnect: z
      .custom<(ctx: ShouldReconnectContext) => boolean | number | undefined>(value => typeof value === 'function', {
        message: 'Expected a function',
      })
      .optional(),
  })
  .strict()

/**
 * Shared between per-call (`LogOptions.reconnect`, resolved by
 * `resolveReconnectPolicy` — throws `WsOptionsError`) and SDK-level
 * (`config.reconnect`, validated earlier by `configSchema` — throws
 * `ConfigurationError`).
 */
export const reconnectOptionSchema = z.union([z.boolean(), reconnectOptionsSchema])

export interface ResolvedReconnectPolicy {
  enabled: boolean
  initial: boolean
  maxElapsedMs?: number
  stableAfterMs?: number
  minDelayMs?: number
  maxDelayMs?: number
  shouldReconnect?: (ctx: ShouldReconnectContext) => boolean | number | undefined
}

const DEFAULT_POLICY: ResolvedReconnectPolicy = { enabled: true, initial: false }

/** Validates and resolves a `reconnect` option, defaulting to enabled with no explicit overrides. */
export const resolveReconnectPolicy = (option?: ReconnectOption): ResolvedReconnectPolicy => {
  if (option === undefined) return DEFAULT_POLICY

  const { data, success, error } = reconnectOptionSchema.safeParse(option)
  if (!success) {
    throw new WsOptionsError(error.issues)
  }

  if (typeof data === 'boolean') return { enabled: data, initial: false }

  return {
    enabled: true,
    initial: data.initial ?? false,
    maxElapsedMs: data.maxElapsedMs,
    stableAfterMs: data.stableAfterMs,
    minDelayMs: data.minDelayMs,
    maxDelayMs: data.maxDelayMs,
    shouldReconnect: data.shouldReconnect,
  }
}

/**
 * Maps a resolved policy's explicit timing overrides onto `LogStreamTuning`
 * field names — only the fields the caller actually set, so merging this
 * into `{ ...DEFAULT_TUNING, ...reconnectPolicyToTuning(policy), ...tuning }`
 * lets an internal test-only `tuning` override always win, and an unset
 * policy field falls through to the module default rather than clobbering it.
 */
export const reconnectPolicyToTuning = (policy: ResolvedReconnectPolicy): Partial<LogStreamTuning> => {
  const tuning: Partial<LogStreamTuning> = {}

  if (policy.minDelayMs !== undefined) tuning.backoffBaseMs = policy.minDelayMs
  if (policy.maxDelayMs !== undefined) tuning.backoffMaxMs = policy.maxDelayMs
  if (policy.maxElapsedMs !== undefined) tuning.reconnectBudgetMs = policy.maxElapsedMs
  if (policy.stableAfterMs !== undefined) tuning.stableAfterMs = policy.stableAfterMs

  return tuning
}
