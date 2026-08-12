import { describe, expect, it } from 'vitest'

import { truncate } from './truncate'

describe('truncate', () => {
  it('returns the text unchanged when it fits the budget', () => {
    const result = truncate('short text', 100)
    expect(result).toEqual({ text: 'short text', truncated: false })
  })

  it('returns the text unchanged when it exactly matches the budget', () => {
    const text = 'x'.repeat(50)
    const result = truncate(text, 50)
    expect(result).toEqual({ text, truncated: false })
  })

  it('truncates and appends an honest marker when over budget', () => {
    const text = 'x'.repeat(200)
    const result = truncate(text, 50)
    expect(result.truncated).toBe(true)
    expect(result.text).toContain('truncated (showing the first 50 of 200 characters)')
    expect(result.text.length).toBeLessThanOrEqual(text.length)
  })

  it('cuts at the last full line before the budget instead of mid-line', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line-${i}: ${'x'.repeat(10)}`)
    const text = lines.join('\n')
    const result = truncate(text, 150)
    const [keptBody] = result.text.split('\n… truncated')
    expect(keptBody.length).toBeGreaterThan(0)
    // keptBody must be a prefix of the original text that ends exactly at a line boundary
    expect(text.startsWith(keptBody)).toBe(true)
    expect(text[keptBody.length]).toBe('\n')
  })

  it('handles a budget too small even for the marker without throwing', () => {
    const text = 'x'.repeat(1000)
    const result = truncate(text, 5)
    expect(result.truncated).toBe(true)
    expect(() => result.text).not.toThrow()
  })
})
