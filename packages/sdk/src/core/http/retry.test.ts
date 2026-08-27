import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'

import { AnyType } from '@/common'

import { createRetryCondition, LOGIN_RETRYABLE_METHODS, SAFE_HTTP_METHODS } from './retry'

const makeError = (over: { method?: string; status?: number; code?: string }): AxiosError => {
  return {
    config: over.method ? { method: over.method } : undefined,
    response: over.status !== undefined ? { status: over.status } : undefined,
    code: over.code,
    isAxiosError: true,
  } as AnyType
}

describe('createRetryCondition', () => {
  const isSafeRetryable = createRetryCondition(SAFE_HTTP_METHODS)

  it.each(['get', 'head', 'options', 'GET', 'Head'])('retries %s on a network error', method => {
    expect(isSafeRetryable(makeError({ method, code: 'ECONNRESET' }))).toBe(true)
  })

  it.each([500, 502, 503, 504, 429])('retries a safe method on status %d', status => {
    expect(isSafeRetryable(makeError({ method: 'get', status }))).toBe(true)
  })

  it.each(['post', 'put', 'patch', 'delete'])('never retries %s, even on a network error', method => {
    expect(isSafeRetryable(makeError({ method, code: 'ECONNRESET' }))).toBe(false)
  })

  it.each(['post', 'put', 'delete'])('never retries %s on a 500', method => {
    expect(isSafeRetryable(makeError({ method, status: 500 }))).toBe(false)
  })

  it('does not retry a safe method on a 404', () => {
    expect(isSafeRetryable(makeError({ method: 'get', status: 404 }))).toBe(false)
  })

  it('does not retry a safe method on a 401', () => {
    expect(isSafeRetryable(makeError({ method: 'get', status: 401 }))).toBe(false)
  })

  it('does not retry a cancelled request (ERR_CANCELED)', () => {
    expect(isSafeRetryable(makeError({ method: 'get', code: 'ERR_CANCELED' }))).toBe(false)
  })

  it('does not retry a timed-out request (ECONNABORTED)', () => {
    expect(isSafeRetryable(makeError({ method: 'get', code: 'ECONNABORTED' }))).toBe(false)
  })

  it('does not retry when the method is missing', () => {
    expect(isSafeRetryable(makeError({ code: 'ECONNRESET' }))).toBe(false)
  })

  describe('LOGIN_RETRYABLE_METHODS', () => {
    const isLoginRetryable = createRetryCondition(LOGIN_RETRYABLE_METHODS)

    it('retries a login POST on a network error', () => {
      expect(isLoginRetryable(makeError({ method: 'post', code: 'ECONNRESET' }))).toBe(true)
    })

    it('retries a login POST on a 500', () => {
      expect(isLoginRetryable(makeError({ method: 'post', status: 500 }))).toBe(true)
    })

    it('does not retry a login POST on a 404', () => {
      expect(isLoginRetryable(makeError({ method: 'post', status: 404 }))).toBe(false)
    })

    it('still never retries put/delete', () => {
      expect(isLoginRetryable(makeError({ method: 'delete', code: 'ECONNRESET' }))).toBe(false)
    })
  })
})
