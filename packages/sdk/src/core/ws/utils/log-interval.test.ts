import { describe, expect, it } from 'vitest'

import { isWsOptionsError } from '@/core/errors'

import { resolveLogInterval } from './log-interval'

describe('resolveLogInterval', () => {
  it('defaults to 1 when interval is undefined', () => {
    expect(resolveLogInterval(undefined)).toBe(1)
  })

  it.each([0, 0.5, 1, 7, 10])('accepts %s', value => {
    expect(resolveLogInterval(value)).toBe(value)
  })

  it.each([-0.1, -1, 10.0001, 11, NaN, Infinity, -Infinity])('rejects %s', value => {
    expect(() => resolveLogInterval(value)).toThrow()
  })

  it('throws a WsOptionsError recognized by its guard', () => {
    try {
      resolveLogInterval(11)
      expect.unreachable()
    } catch (error) {
      expect(isWsOptionsError(error)).toBe(true)
    }
  })

  it('carries the zod issues as error details', () => {
    try {
      resolveLogInterval(11)
      expect.unreachable()
    } catch (error) {
      expect(isWsOptionsError(error) && Array.isArray(error.details)).toBe(true)
    }
  })
})
