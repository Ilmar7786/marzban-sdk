import { describe, expect, it } from 'vitest'

import { canonicalize } from './canonical'

describe('canonicalize', () => {
  it('produces the same string regardless of key order', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }))
  })

  it('sorts keys of nested objects', () => {
    expect(canonicalize({ outer: { z: 1, a: 2 } })).toBe('{"outer":{"a":2,"z":1}}')
  })

  it('preserves array order and sorts objects inside arrays', () => {
    expect(canonicalize([{ b: 1, a: 2 }, 'x'])).toBe('[{"a":2,"b":1},"x"]')
  })

  it('leaves primitives and null untouched', () => {
    expect(canonicalize('str')).toBe('"str"')
    expect(canonicalize(42)).toBe('42')
    expect(canonicalize(null)).toBe('null')
  })

  it('produces different strings for different values', () => {
    expect(canonicalize({ a: 1 })).not.toBe(canonicalize({ a: 2 }))
  })
})
