import { describe, expect, it } from 'vitest'

import type { AnyType } from '@/common'

import { getWsErrorMessage, isForbiddenWsError } from './ws-error'

describe('getWsErrorMessage', () => {
  it('returns the message property when present', () => {
    expect(getWsErrorMessage({ message: '403 Forbidden' } as AnyType)).toBe('403 Forbidden')
  })

  it('returns an empty string when no message property is present', () => {
    expect(getWsErrorMessage({} as AnyType)).toBe('')
  })
})

describe('isForbiddenWsError', () => {
  it('recognizes a message containing 403', () => {
    expect(isForbiddenWsError('403 Forbidden')).toBe(true)
  })

  it('rejects a message that does not mention 403', () => {
    expect(isForbiddenWsError('Network error')).toBe(false)
  })

  it('rejects an empty message', () => {
    expect(isForbiddenWsError('')).toBe(false)
  })
})
