import { describe, expect, it } from 'vitest'

import { isDurationString, parseDurationMs } from './duration'

describe('isDurationString', () => {
  it.each(['30d', '12h', '45m', '90s', '1d', '0s'])('accepts %j', input => {
    expect(isDurationString(input)).toBe(true)
  })

  it.each(['30D', ' 30d ', '30 d'])('is case-insensitive and tolerates surrounding/inner whitespace: %j', input => {
    expect(isDurationString(input)).toBe(true)
  })

  it.each(['30', 'd30', '30x', '', '1d2h', 'thirty days'])('rejects %j', input => {
    expect(isDurationString(input)).toBe(false)
  })
})

describe('parseDurationMs', () => {
  it('parses seconds', () => {
    expect(parseDurationMs('90s')).toBe(90_000)
  })

  it('parses minutes', () => {
    expect(parseDurationMs('45m')).toBe(45 * 60_000)
  })

  it('parses hours', () => {
    expect(parseDurationMs('12h')).toBe(12 * 3_600_000)
  })

  it('parses days', () => {
    expect(parseDurationMs('30d')).toBe(30 * 86_400_000)
  })

  it('is case-insensitive on the unit', () => {
    expect(parseDurationMs('30D')).toBe(parseDurationMs('30d'))
  })

  it('throws a readable error for an invalid duration', () => {
    expect(() => parseDurationMs('thirty days')).toThrow('Invalid duration "thirty days"')
  })
})
