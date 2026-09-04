import { describe, expect, it, vi } from 'vitest'

import { ERROR_CODES, WsError } from '@/core/errors'

import { decideReconnect } from './reconnect-decision'
import type { ResolvedReconnectPolicy } from './reconnect-policy'

const error = new WsError(ERROR_CODES.WS_CONNECTION_LOST, {
  phase: 'connection',
  attempt: 1,
  url: 'wss://panel.example.com/api/core/logs',
})

const enabledPolicy: ResolvedReconnectPolicy = { enabled: true, initial: false }

describe('decideReconnect', () => {
  it('stops when the policy is disabled, without consulting shouldReconnect', () => {
    const shouldReconnect = vi.fn()
    const verdict = decideReconnect({
      policy: { enabled: false, initial: false, shouldReconnect },
      attempt: 1,
      elapsedMs: 0,
      baseDelayMs: 1_000,
      error,
    })

    expect(verdict).toEqual({ retry: false })
    expect(shouldReconnect).not.toHaveBeenCalled()
  })

  it('retries with the computed backoff when no shouldReconnect is set', () => {
    const verdict = decideReconnect({ policy: enabledPolicy, attempt: 1, elapsedMs: 0, baseDelayMs: 1_234, error })

    expect(verdict).toEqual({ retry: true, delayMs: 1_234 })
  })

  it('stops when shouldReconnect returns false', () => {
    const verdict = decideReconnect({
      policy: { ...enabledPolicy, shouldReconnect: () => false },
      attempt: 1,
      elapsedMs: 0,
      baseDelayMs: 1_000,
      error,
    })

    expect(verdict).toEqual({ retry: false })
  })

  it('retries with the computed backoff when shouldReconnect returns true', () => {
    const verdict = decideReconnect({
      policy: { ...enabledPolicy, shouldReconnect: () => true },
      attempt: 1,
      elapsedMs: 0,
      baseDelayMs: 1_234,
      error,
    })

    expect(verdict).toEqual({ retry: true, delayMs: 1_234 })
  })

  it('retries with the computed backoff when shouldReconnect returns undefined', () => {
    const verdict = decideReconnect({
      policy: { ...enabledPolicy, shouldReconnect: () => undefined },
      attempt: 1,
      elapsedMs: 0,
      baseDelayMs: 1_234,
      error,
    })

    expect(verdict).toEqual({ retry: true, delayMs: 1_234 })
  })

  it('overrides the delay when shouldReconnect returns a number', () => {
    const verdict = decideReconnect({
      policy: { ...enabledPolicy, shouldReconnect: () => 42 },
      attempt: 1,
      elapsedMs: 0,
      baseDelayMs: 1_234,
      error,
    })

    expect(verdict).toEqual({ retry: true, delayMs: 42 })
  })

  it('passes attempt, elapsedMs and the error through to shouldReconnect', () => {
    const shouldReconnect = vi.fn().mockReturnValue(true)

    decideReconnect({
      policy: { ...enabledPolicy, shouldReconnect },
      attempt: 3,
      elapsedMs: 5_000,
      baseDelayMs: 1_000,
      error,
    })

    expect(shouldReconnect).toHaveBeenCalledExactlyOnceWith({ attempt: 3, elapsedMs: 5_000, error })
  })
})
