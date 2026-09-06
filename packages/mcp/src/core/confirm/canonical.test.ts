import { describe, expect, it } from 'vitest'

import { callKey, canonicalize, hashCallArgs } from './canonical'

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

describe('hashCallArgs', () => {
  it('ignores confirmToken', () => {
    expect(hashCallArgs({ username: 'alice', confirmToken: 'abc' })).toBe(hashCallArgs({ username: 'alice' }))
  })

  it('is unaffected by key order', () => {
    expect(hashCallArgs({ b: 1, a: 2 })).toBe(hashCallArgs({ a: 2, b: 1 }))
  })

  it('differs for different arguments', () => {
    expect(hashCallArgs({ username: 'alice' })).not.toBe(hashCallArgs({ username: 'bob' }))
  })

  it('differs when a boolean flag flips', () => {
    expect(hashCallArgs({ all: false })).not.toBe(hashCallArgs({ all: true }))
  })

  it('handles undefined args', () => {
    expect(hashCallArgs(undefined)).toBe(hashCallArgs({}))
  })
})

describe('callKey', () => {
  it('is the same for the same tool and arguments', () => {
    expect(callKey('marzban_users_delete', { username: 'alice' })).toBe(
      callKey('marzban_users_delete', { username: 'alice' })
    )
  })

  it('ignores confirmToken, so a retry carrying one matches the original call', () => {
    expect(callKey('marzban_users_delete', { username: 'alice', confirmToken: 'v1.abc' })).toBe(
      callKey('marzban_users_delete', { username: 'alice' })
    )
  })

  it('differs for the same arguments on a different tool', () => {
    expect(callKey('marzban_users_delete', { username: 'alice' })).not.toBe(
      callKey('marzban_users_reset_traffic', { username: 'alice' })
    )
  })

  it('differs for different arguments on the same tool', () => {
    expect(callKey('marzban_users_delete', { username: 'alice' })).not.toBe(
      callKey('marzban_users_delete', { username: 'bob' })
    )
  })
})
