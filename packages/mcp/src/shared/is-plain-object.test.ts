import { describe, expect, it } from 'vitest'

import { isPlainObject } from './is-plain-object'

describe('isPlainObject', () => {
  it('accepts objects', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1 })).toBe(true)
  })

  it('rejects null, arrays and primitives', () => {
    for (const value of [null, undefined, [], [1], 'x', 1, true]) {
      expect(isPlainObject(value)).toBe(false)
    }
  })
})
