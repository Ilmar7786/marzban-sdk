import { describe, expect, it } from 'vitest'

import { addDays, addHours, addToDate, humanRemaining, remainingTime, toIso } from './datetime'

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

describe('addToDate', () => {
  const base = new Date('2024-01-01T00:00:00.000Z')

  it('returns a new Date instance (immutable)', () => {
    const result = addToDate(base, { days: 1 })
    expect(result).not.toBe(base)
    expect(base.toISOString()).toBe('2024-01-01T00:00:00.000Z')
  })

  it('adds days', () => {
    expect(addToDate(base, { days: 2 }).toISOString()).toBe('2024-01-03T00:00:00.000Z')
  })

  it('adds hours', () => {
    expect(addToDate(base, { hours: 3 }).toISOString()).toBe('2024-01-01T03:00:00.000Z')
  })

  it('adds minutes', () => {
    expect(addToDate(base, { minutes: 90 }).toISOString()).toBe('2024-01-01T01:30:00.000Z')
  })

  it('adds seconds', () => {
    expect(addToDate(base, { seconds: 61 }).toISOString()).toBe('2024-01-01T00:01:01.000Z')
  })

  it('adds milliseconds', () => {
    expect(addToDate(base, { ms: 500 }).getTime()).toBe(base.getTime() + 500)
  })

  it('adds all components together', () => {
    const result = addToDate(base, { days: 1, hours: 2, minutes: 3, seconds: 4, ms: 5 })
    const expected = base.getTime() + DAY + 2 * HOUR + 3 * MIN + 4 * SEC + 5
    expect(result.getTime()).toBe(expected)
  })

  it('accepts a string date', () => {
    const result = addToDate('2024-01-01T00:00:00.000Z', { days: 1 })
    expect(result.toISOString()).toBe('2024-01-02T00:00:00.000Z')
  })

  it('accepts a timestamp (number)', () => {
    const result = addToDate(base.getTime(), { hours: 1 })
    expect(result.getTime()).toBe(base.getTime() + HOUR)
  })

  it('subtracts when given negative values', () => {
    const result = addToDate(base, { days: -1 })
    expect(result.toISOString()).toBe('2023-12-31T00:00:00.000Z')
  })

  it('handles empty opts (no-op)', () => {
    expect(addToDate(base, {}).getTime()).toBe(base.getTime())
  })
})

describe('addDays', () => {
  it('adds positive days', () => {
    const base = new Date('2024-01-01T00:00:00.000Z')
    expect(addDays(base, 5).toISOString()).toBe('2024-01-06T00:00:00.000Z')
  })

  it('subtracts days when negative', () => {
    const base = new Date('2024-01-10T00:00:00.000Z')
    expect(addDays(base, -3).toISOString()).toBe('2024-01-07T00:00:00.000Z')
  })

  it('adding 0 days returns same time', () => {
    const base = new Date('2024-06-15T12:00:00.000Z')
    expect(addDays(base, 0).getTime()).toBe(base.getTime())
  })
})

describe('addHours', () => {
  it('adds positive hours', () => {
    const base = new Date('2024-01-01T00:00:00.000Z')
    expect(addHours(base, 5).toISOString()).toBe('2024-01-01T05:00:00.000Z')
  })

  it('crosses midnight correctly', () => {
    const base = new Date('2024-01-01T22:00:00.000Z')
    expect(addHours(base, 3).toISOString()).toBe('2024-01-02T01:00:00.000Z')
  })
})

describe('remainingTime', () => {
  it('returns correct breakdown for a future time', () => {
    const from = new Date('2024-01-01T00:00:00.000Z')
    const to = new Date(from.getTime() + 2 * DAY + 5 * HOUR + 3 * MIN + 10 * SEC)
    const r = remainingTime(to, from)
    expect(r.days).toBe(2)
    expect(r.hours).toBe(5)
    expect(r.minutes).toBe(3)
    expect(r.seconds).toBe(10)
    expect(r.totalMs).toBe(2 * DAY + 5 * HOUR + 3 * MIN + 10 * SEC)
  })

  it('returns all zeros when to === from', () => {
    const now = Date.now()
    const r = remainingTime(now, now)
    expect(r).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 })
  })

  it('returns negative totalMs when to is in the past', () => {
    const from = Date.now()
    const to = from - 5000
    const r = remainingTime(to, from)
    expect(r.totalMs).toBe(-5000)
    // breakdown components are still clamped to zero
    expect(r.days).toBe(0)
    expect(r.seconds).toBe(0)
  })

  it('totalMs equals the raw delta in ms', () => {
    const from = new Date('2024-03-01T00:00:00.000Z')
    const to = new Date(from.getTime() + 12345678)
    expect(remainingTime(to, from).totalMs).toBe(12345678)
  })

  it('handles string dates for both arguments', () => {
    const r = remainingTime('2024-01-02T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
    expect(r.days).toBe(1)
    expect(r.hours).toBe(0)
  })

  it('handles exactly 1 day', () => {
    const from = new Date('2024-01-01T00:00:00.000Z')
    const to = new Date(from.getTime() + DAY)
    const r = remainingTime(to, from)
    expect(r.days).toBe(1)
    expect(r.hours).toBe(0)
    expect(r.minutes).toBe(0)
    expect(r.seconds).toBe(0)
  })
})

describe('humanRemaining', () => {
  const from = new Date('2024-01-01T00:00:00.000Z')

  it('formats days, hours, minutes and seconds together', () => {
    const to = new Date(from.getTime() + 2 * DAY + 5 * HOUR + 3 * MIN + 10 * SEC)
    expect(humanRemaining(to, from)).toBe('2d 5h 3m 10s')
  })

  it('includes seconds when minutes are also present', () => {
    // FIX verification: original code dropped seconds when parts.length > 0
    const to = new Date(from.getTime() + MIN + 45 * SEC)
    expect(humanRemaining(to, from)).toBe('1m 45s')
  })

  it('shows only seconds when less than a minute remains', () => {
    const to = new Date(from.getTime() + 30 * SEC)
    expect(humanRemaining(to, from)).toBe('30s')
  })

  it('returns "< 1s" when less than one second remains', () => {
    // FIX verification: original code returned "" for sub-second remainders
    const to = new Date(from.getTime() + 500)
    expect(humanRemaining(to, from)).toBe('< 1s')
  })

  it('returns "expired" when to is strictly in the past', () => {
    const to = new Date(from.getTime() - SEC)
    expect(humanRemaining(to, from)).toBe('expired')
  })

  it('returns "< 1s" when to === from (deadline is right now, not expired)', () => {
    // FIX verification: original code returned "expired" for totalMs === 0
    expect(humanRemaining(from, from)).toBe('< 1s')
  })

  it('omits zero-valued components in the middle', () => {
    const to = new Date(from.getTime() + DAY + 30 * SEC)
    expect(humanRemaining(to, from)).toBe('1d 30s')
  })

  it('shows only days when hours, minutes and seconds are all zero', () => {
    const to = new Date(from.getTime() + 3 * DAY)
    expect(humanRemaining(to, from)).toBe('3d')
  })

  it('works with default from = Date.now() (smoke test)', () => {
    const future = Date.now() + 10 * MIN
    const result = humanRemaining(future)
    expect(result).toMatch(/m/)
  })
})

describe('toIso', () => {
  it('strips milliseconds from the ISO string', () => {
    expect(toIso(new Date('2024-01-01T12:34:56.789Z'))).toBe('2024-01-01T12:34:56Z')
  })

  it('keeps the Z suffix', () => {
    expect(toIso(new Date('2024-06-15T00:00:00.000Z'))).toMatch(/Z$/)
  })

  it('accepts a timestamp number', () => {
    const ts = new Date('2024-01-01T00:00:00.000Z').getTime()
    expect(toIso(ts)).toBe('2024-01-01T00:00:00Z')
  })

  it('accepts a string date', () => {
    expect(toIso('2024-03-01T10:20:30.000Z')).toBe('2024-03-01T10:20:30Z')
  })

  it('handles a date with exactly .000Z (no-op replacement)', () => {
    expect(toIso(new Date('2024-01-01T00:00:00.000Z'))).toBe('2024-01-01T00:00:00Z')
  })
})
