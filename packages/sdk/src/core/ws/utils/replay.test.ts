import { describe, expect, it } from 'vitest'

import { isWsOptionsError } from '@/core/errors'

import { createReplayFilter, resolveReplayMode } from './replay'

describe('resolveReplayMode', () => {
  it('defaults to dedup when mode is undefined', () => {
    expect(resolveReplayMode(undefined)).toBe('dedup')
  })

  it.each(['all', 'dedup', 'skip'] as const)('accepts %s', mode => {
    expect(resolveReplayMode(mode)).toBe(mode)
  })

  it('throws a WsOptionsError recognized by its guard for an invalid mode', () => {
    // @ts-expect-error deliberately invalid input
    expect(() => resolveReplayMode('bogus')).toThrow()
    try {
      // @ts-expect-error deliberately invalid input
      resolveReplayMode('bogus')
      expect.unreachable()
    } catch (error) {
      expect(isWsOptionsError(error)).toBe(true)
    }
  })
})

describe('createReplayFilter', () => {
  describe("mode: 'all'", () => {
    it('always delivers by identity, armed or not, duplicate or not', () => {
      const filter = createReplayFilter('all')
      filter.arm()

      const first = filter.accept('same line')
      const second = filter.accept('same line')

      expect(first).toEqual({ deliver: true, data: 'same line' })
      expect(second).toEqual({ deliver: true, data: 'same line' })
    })
  })

  describe('non-string payloads', () => {
    it('passes a non-string payload through and disarms', () => {
      const filter = createReplayFilter('dedup')
      filter.arm()

      const result = filter.accept(new ArrayBuffer(4))

      expect(result.deliver).toBe(true)
      // Disarmed: a following duplicate string is no longer suppressed either.
      filter.accept('line one')
      const after = filter.accept('line one')
      expect(after).toEqual({ deliver: true, data: 'line one' })
    })
  })

  describe("mode: 'dedup'", () => {
    it('records lines and delivers by identity while not armed, even for a repeated line', () => {
      const filter = createReplayFilter('dedup')

      const first = filter.accept('line one')
      const second = filter.accept('line one')

      expect(first).toEqual({ deliver: true, data: 'line one' })
      expect(second).toEqual({ deliver: true, data: 'line one' })
    })

    it('records a multi-line, trailing-newline message correctly (an empty trailing segment is never indexed)', () => {
      const filter = createReplayFilter('dedup')
      filter.accept('line one\nline two\n')
      filter.arm()

      // The trailing empty segment must not make an empty replayed line look "new".
      const result = filter.accept('line one\nline two\n')

      expect(result).toEqual({ deliver: false })
    })

    it('suppresses a fully-duplicate replayed frame and stays armed', () => {
      const filter = createReplayFilter('dedup')
      filter.accept('line one')
      filter.accept('line two')
      filter.arm()

      const result = filter.accept('line one\nline two')

      expect(result).toEqual({ deliver: false })
    })

    it('delivers an entirely new frame by identity and disarms', () => {
      const filter = createReplayFilter('dedup')
      filter.accept('line one')
      filter.arm()

      const result = filter.accept('a brand new line')

      expect(result).toEqual({ deliver: true, data: 'a brand new line' })

      // Disarmed: a duplicate delivered next is no longer suppressed.
      const next = filter.accept('line one')
      expect(next).toEqual({ deliver: true, data: 'line one' })
    })

    it('drops the leading duplicate run of a mixed frame and delivers the rest, rejoined', () => {
      const filter = createReplayFilter('dedup')
      filter.accept('line one')
      filter.accept('line two')
      filter.arm()

      const result = filter.accept('line one\nline two\nline three')

      expect(result).toEqual({ deliver: true, data: 'line three' })
    })

    it('never suppresses a legitimately repeated line while not armed', () => {
      const filter = createReplayFilter('dedup')

      const results = ['OK', 'OK', 'OK'].map(line => filter.accept(line))

      expect(results).toEqual([
        { deliver: true, data: 'OK' },
        { deliver: true, data: 'OK' },
        { deliver: true, data: 'OK' },
      ])
    })

    it('empty payload while armed stays suppressed and keeps the window armed', () => {
      const filter = createReplayFilter('dedup')
      filter.accept('line one')
      filter.arm()

      const result = filter.accept('')

      expect(result).toEqual({ deliver: false })

      // Still armed: a genuine duplicate right after is still suppressed too.
      const next = filter.accept('line one')
      expect(next).toEqual({ deliver: false })
    })

    it('forgets a line once its last occurrence is evicted from the ring, but not a duplicate still inside it', () => {
      const filter = createReplayFilter('dedup', 2)

      filter.accept('a')
      filter.accept('a') // ring: [a, a] — at capacity, not yet evicted
      filter.accept('b') // evicts the oldest 'a': one occurrence remains (count 2 -> 1)
      filter.accept('c') // evicts the last 'a': now fully forgotten (count 1 -> deleted)

      filter.arm()
      const result = filter.accept('a')

      // 'a' was fully evicted — this is a genuinely new line, not a replay.
      expect(result).toEqual({ deliver: true, data: 'a' })
    })

    it('force-disarms once the hard cap of scanned lines is reached, flushing the remainder even if it too was seen', () => {
      const filter = createReplayFilter('dedup', 3)
      // All three fit the ring (bufferLines 3) without evicting each other.
      ;['L1', 'L2', 'L3'].forEach(line => filter.accept(line))
      filter.arm()

      const result = filter.accept('L1\nL2\nL3\nL1\nL2')

      // The 4th line (a repeated L1) crosses the cap (scanned count 4 >
      // bufferLines 3): the window force-disarms there, so the 5th line
      // (L2) flows through too even though it was also previously delivered.
      expect(result).toEqual({ deliver: true, data: 'L2' })
    })
  })

  describe("mode: 'skip'", () => {
    it('drops the whole message when it contains any previously delivered line, and stays armed', () => {
      const filter = createReplayFilter('skip')
      filter.accept('line one')
      filter.arm()

      const result = filter.accept('line one\nline two')

      expect(result).toEqual({ deliver: false })
    })

    it('delivers the first message with no previously delivered line, by identity, and disarms', () => {
      const filter = createReplayFilter('skip')
      filter.accept('line one')
      filter.arm()

      const result = filter.accept('a brand new line')

      expect(result).toEqual({ deliver: true, data: 'a brand new line' })

      const next = filter.accept('line one')
      expect(next).toEqual({ deliver: true, data: 'line one' })
    })

    it('degenerates to per-line dedup at interval 0 (one line per message)', () => {
      const filter = createReplayFilter('skip')
      filter.accept('line one')
      filter.arm()

      const first = filter.accept('line one')
      const second = filter.accept('a brand new line')

      expect(first).toEqual({ deliver: false })
      expect(second).toEqual({ deliver: true, data: 'a brand new line' })
    })

    it('force-disarms and delivers the whole message once the hard cap is reached, even though it still contains a seen line', () => {
      const filter = createReplayFilter('skip', 2)
      filter.accept('x')
      filter.accept('y')
      filter.arm()

      const result = filter.accept('x\ny\nz')

      expect(result).toEqual({ deliver: true, data: 'x\ny\nz' })
    })
  })

  describe('arm()', () => {
    it('re-arming resets the scanned-lines cap for a fresh window', () => {
      const filter = createReplayFilter('dedup', 1)
      filter.accept('a')
      filter.arm()

      // Trips the cap on the first window (scanned count 2 > bufferLines 1),
      // forcing a disarm partway through.
      filter.accept('a\na')

      filter.accept('b')
      filter.arm()
      // A fresh window: the cap must not carry over from the previous arm().
      const result = filter.accept('b')

      expect(result).toEqual({ deliver: false })
    })
  })
})
