import { describe, expect, it, vi } from 'vitest'

import { isWsOptionsError } from '@/core/errors'

import { reconnectPolicyToTuning, resolveReconnectPolicy } from './reconnect-policy'

describe('resolveReconnectPolicy', () => {
  it('defaults to enabled with no explicit overrides when the option is undefined', () => {
    expect(resolveReconnectPolicy(undefined)).toEqual({ enabled: true, initial: false })
  })

  it('treats true the same as the default', () => {
    expect(resolveReconnectPolicy(true)).toEqual({ enabled: true, initial: false })
  })

  it('disables reconnecting on false', () => {
    expect(resolveReconnectPolicy(false)).toEqual({ enabled: false, initial: false })
  })

  it('resolves every explicit field of an options object', () => {
    const shouldReconnect = vi.fn()

    expect(
      resolveReconnectPolicy({
        initial: true,
        maxElapsedMs: 60_000,
        stableAfterMs: 5_000,
        minDelayMs: 100,
        maxDelayMs: 10_000,
        shouldReconnect,
      })
    ).toEqual({
      enabled: true,
      initial: true,
      maxElapsedMs: 60_000,
      stableAfterMs: 5_000,
      minDelayMs: 100,
      maxDelayMs: 10_000,
      shouldReconnect,
    })
  })

  it('leaves unset fields undefined rather than defaulting them', () => {
    const resolved = resolveReconnectPolicy({ minDelayMs: 100 })

    expect(resolved).toEqual({ enabled: true, initial: false, minDelayMs: 100 })
    expect(resolved.maxElapsedMs).toBeUndefined()
  })

  it('accepts Infinity for maxElapsedMs (unlimited retries)', () => {
    expect(resolveReconnectPolicy({ maxElapsedMs: Infinity }).maxElapsedMs).toBe(Infinity)
  })

  it('throws a WsOptionsError recognized by its guard for an invalid field', () => {
    expect(() => resolveReconnectPolicy({ minDelayMs: -1 })).toThrow()
    try {
      resolveReconnectPolicy({ minDelayMs: -1 })
      expect.unreachable()
    } catch (error) {
      expect(isWsOptionsError(error)).toBe(true)
    }
  })

  it('rejects an unknown key', () => {
    // @ts-expect-error deliberately invalid input
    expect(() => resolveReconnectPolicy({ maxRetries: 5 })).toThrow()
  })

  it('rejects a non-function shouldReconnect', () => {
    // @ts-expect-error deliberately invalid input
    expect(() => resolveReconnectPolicy({ shouldReconnect: 'nope' })).toThrow()
  })
})

describe('reconnectPolicyToTuning', () => {
  it('maps no fields when the policy has no explicit timing overrides', () => {
    expect(reconnectPolicyToTuning({ enabled: true, initial: false })).toEqual({})
  })

  it('maps every explicit timing field to its LogStreamTuning name', () => {
    expect(
      reconnectPolicyToTuning({
        enabled: true,
        initial: false,
        minDelayMs: 100,
        maxDelayMs: 10_000,
        maxElapsedMs: 60_000,
        stableAfterMs: 5_000,
      })
    ).toEqual({
      backoffBaseMs: 100,
      backoffMaxMs: 10_000,
      reconnectBudgetMs: 60_000,
      stableAfterMs: 5_000,
    })
  })

  it('is unaffected by enabled/initial/shouldReconnect', () => {
    expect(reconnectPolicyToTuning({ enabled: false, initial: true, shouldReconnect: () => true as const })).toEqual({})
  })
})
