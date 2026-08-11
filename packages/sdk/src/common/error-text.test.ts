import { describe, expect, it } from 'vitest'

import { errorText } from './error-text'
import { redactSecrets } from './redact'

describe('errorText', () => {
  it('returns an empty string for undefined, null, and empty string', () => {
    expect(errorText(undefined)).toBe('')
    expect(errorText(null)).toBe('')
    expect(errorText('')).toBe('')
  })

  it('returns a plain string as-is', () => {
    expect(errorText('boom')).toBe('boom')
  })

  it("prefers a real Error's stack", () => {
    const err = new Error('oops')
    expect(errorText(err)).toBe(err.stack)
  })

  it("falls back to an Error's message when stack is missing", () => {
    const err = new Error('oops')
    err.stack = undefined
    expect(errorText(err)).toBe('oops')
  })

  it('reads .stack off a plain object shaped like a redacted Error', () => {
    const redacted = redactSecrets(new Error('boom'))
    expect(errorText(redacted)).toContain('Error: boom')
  })

  it('reads .message off a plain object with no .stack', () => {
    expect(errorText({ message: 'plain message object' })).toBe('plain message object')
  })

  it('stringifies a value with neither .stack nor .message', () => {
    expect(errorText({ code: 'X' })).toBe('[object Object]')
  })

  it('stringifies non-object, non-string values', () => {
    expect(errorText(42)).toBe('42')
  })
})
