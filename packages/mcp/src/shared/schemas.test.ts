import { describe, expect, it } from 'vitest'

import { durationMsInputSchema, sizeInputSchema, timestampInputSchema, usernameSchema } from './schemas'

describe('usernameSchema', () => {
  it('accepts a valid username', () => {
    expect(usernameSchema.safeParse('alice_01').success).toBe(true)
  })

  it('rejects a username shorter than 3 characters', () => {
    expect(usernameSchema.safeParse('ab').success).toBe(false)
  })

  it('rejects a username longer than 32 characters', () => {
    expect(usernameSchema.safeParse('a'.repeat(33)).success).toBe(false)
  })

  it('rejects characters outside letters/digits/underscore', () => {
    expect(usernameSchema.safeParse('alice-01').success).toBe(false)
    expect(usernameSchema.safeParse('alice 01').success).toBe(false)
    expect(usernameSchema.safeParse('alice@01').success).toBe(false)
  })
})

describe('sizeInputSchema', () => {
  it('parses a human size string to bytes', () => {
    expect(sizeInputSchema.parse('10GB')).toBe(10 * 1024 ** 3)
  })

  it('passes a raw byte count through unchanged', () => {
    expect(sizeInputSchema.parse(2048)).toBe(2048)
  })

  it('rejects a negative raw byte count', () => {
    expect(sizeInputSchema.safeParse(-1).success).toBe(false)
  })

  it('rejects a malformed size string instead of silently defaulting to 0', () => {
    const result = sizeInputSchema.safeParse('10GBB')
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(sizeInputSchema.safeParse('').success).toBe(false)
  })
})

describe('timestampInputSchema', () => {
  it('passes a raw Unix-seconds number through unchanged', () => {
    expect(timestampInputSchema.parse(1_700_000_000)).toBe(1_700_000_000)
  })

  it('resolves a relative duration to now + the duration, in Unix seconds', () => {
    const before = Date.now()
    const result = timestampInputSchema.parse('30d')
    const after = Date.now()
    expect(result).toBeGreaterThanOrEqual(Math.floor((before + 30 * 86_400_000) / 1000))
    expect(result).toBeLessThanOrEqual(Math.floor((after + 30 * 86_400_000) / 1000) + 1)
  })

  it('resolves an absolute ISO datetime to its Unix-seconds equivalent', () => {
    const result = timestampInputSchema.parse('2026-09-01T00:00:00Z')
    expect(result).toBe(Math.floor(new Date('2026-09-01T00:00:00Z').getTime() / 1000))
  })

  it('rejects a string that is neither a duration nor a valid date', () => {
    const result = timestampInputSchema.safeParse('not a date')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('Expected a relative duration')
  })

  it('rejects a negative raw number', () => {
    expect(timestampInputSchema.safeParse(-1).success).toBe(false)
  })
})

describe('durationMsInputSchema', () => {
  it('parses a duration string to milliseconds', () => {
    expect(durationMsInputSchema.parse('30d')).toBe(30 * 86_400_000)
  })

  it('rejects a non-duration string instead of throwing', () => {
    const result = durationMsInputSchema.safeParse('30 days')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('Expected a duration like')
  })
})
