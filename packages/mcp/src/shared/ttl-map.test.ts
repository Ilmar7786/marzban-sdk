import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createTtlMap } from './ttl-map'

describe('createTtlMap', () => {
  it('returns a stored value before its TTL elapses', () => {
    const map = createTtlMap<string>()
    map.set('a', 'value', 1000)
    expect(map.get('a')).toBe('value')
  })

  it('returns undefined for a key that was never set', () => {
    expect(createTtlMap<string>().get('missing')).toBeUndefined()
  })

  it('overwrites an existing key and refreshes its TTL', () => {
    const map = createTtlMap<string>()
    map.set('a', 'first', 1000)
    map.set('a', 'second', 1000)
    expect(map.get('a')).toBe('second')
    expect(map.size).toBe(1)
  })

  it('forgets a deleted key', () => {
    const map = createTtlMap<string>()
    map.set('a', 'value', 1000)
    map.delete('a')
    expect(map.get('a')).toBeUndefined()
  })

  describe('expiry', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('returns undefined once the TTL has elapsed', () => {
      const map = createTtlMap<string>()
      map.set('a', 'value', 1000)
      vi.advanceTimersByTime(1001)
      expect(map.get('a')).toBeUndefined()
    })

    it('sweeps expired entries out instead of merely hiding them', () => {
      const map = createTtlMap<string>()
      map.set('a', 'value', 1000)
      expect(map.size).toBe(1)
      vi.advanceTimersByTime(1001)
      expect(map.size).toBe(0)
    })

    it('sweeps a stale entry when an unrelated key is written', () => {
      const map = createTtlMap<string>()
      map.set('a', 'value', 1000)
      vi.advanceTimersByTime(1001)
      map.set('b', 'other', 1000)
      expect(map.get('a')).toBeUndefined()
      expect(map.get('b')).toBe('other')
    })
  })

  describe('maxEntries', () => {
    it('evicts the oldest entry when the cap would be exceeded', () => {
      const map = createTtlMap<string>({ maxEntries: 2 })
      map.set('a', 'first', 1000)
      map.set('b', 'second', 1000)
      map.set('c', 'third', 1000)
      expect(map.get('a')).toBeUndefined()
      expect(map.get('b')).toBe('second')
      expect(map.get('c')).toBe('third')
      expect(map.size).toBe(2)
    })

    it('does not evict while below the cap', () => {
      const map = createTtlMap<string>({ maxEntries: 2 })
      map.set('a', 'first', 1000)
      expect(map.get('a')).toBe('first')
      expect(map.size).toBe(1)
    })

    it('treats a re-set key as the newest, not the oldest', () => {
      const map = createTtlMap<string>({ maxEntries: 2 })
      map.set('a', 'first', 1000)
      map.set('b', 'second', 1000)
      map.set('a', 'refreshed', 1000)
      map.set('c', 'third', 1000)
      expect(map.get('a')).toBe('refreshed')
      expect(map.get('b')).toBeUndefined()
    })

    it('keeps every entry when no cap is configured', () => {
      const map = createTtlMap<string>()
      map.set('a', 'first', 1000)
      map.set('b', 'second', 1000)
      map.set('c', 'third', 1000)
      expect(map.size).toBe(3)
    })
  })
})
