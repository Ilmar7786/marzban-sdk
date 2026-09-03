import { afterEach, describe, expect, it, vi } from 'vitest'

import { computeBackoff } from './backoff'

describe('computeBackoff', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('without jitter (default)', () => {
    it('doubles the delay each attempt starting from baseMs', () => {
      const options = { baseMs: 1000, maxMs: 30_000 }
      expect(computeBackoff(1, options)).toBe(1000)
      expect(computeBackoff(2, options)).toBe(2000)
      expect(computeBackoff(3, options)).toBe(4000)
      expect(computeBackoff(4, options)).toBe(8000)
    })

    it('caps the delay at maxMs', () => {
      expect(computeBackoff(10, { baseMs: 1000, maxMs: 30_000 })).toBe(30_000)
    })

    it('is deterministic — same input always returns the same output', () => {
      const options = { baseMs: 1000, maxMs: 30_000 }
      expect(computeBackoff(3, options)).toBe(computeBackoff(3, options))
    })
  })

  describe('with jitter', () => {
    it('returns exactly half the capped delay when Math.random() is 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)
      expect(computeBackoff(2, { baseMs: 1000, maxMs: 30_000, jitter: true })).toBe(1000)
    })

    it('returns the full capped delay when Math.random() is just under 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999999999)
      const result = computeBackoff(2, { baseMs: 1000, maxMs: 30_000, jitter: true })
      expect(result).toBeGreaterThan(1999)
      expect(result).toBeLessThanOrEqual(2000)
    })

    it('never returns less than half the capped delay across many samples', () => {
      const options = { baseMs: 1000, maxMs: 30_000, jitter: true }
      for (let attempt = 1; attempt <= 6; attempt++) {
        const capped = Math.min(2 ** (attempt - 1) * 1000, 30_000)
        for (let i = 0; i < 20; i++) {
          const result = computeBackoff(attempt, options)
          expect(result).toBeGreaterThanOrEqual(capped / 2)
          expect(result).toBeLessThanOrEqual(capped)
        }
      }
    })
  })
})
