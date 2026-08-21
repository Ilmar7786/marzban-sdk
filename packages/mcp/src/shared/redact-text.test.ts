import { describe, expect, it } from 'vitest'

import { redactText } from './redact-text'

describe('redactText', () => {
  it('redacts a Bearer token', () => {
    const result = redactText('Authorization: Bearer abc123.def456-ghi')
    expect(result).toBe('Authorization: Bearer [REDACTED]')
  })

  it('redacts a raw JWT-shaped string', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
    const result = redactText(`token=${jwt}`)
    expect(result).toBe('token=[REDACTED_JWT]')
  })

  it('redacts a stringified password field', () => {
    const result = redactText('{"username":"admin","password":"hunter2"}')
    expect(result).toBe('{"username":"admin","password":"[REDACTED]"}')
  })

  it('redacts a stringified token/access_token/secret field regardless of case', () => {
    expect(redactText('{"TOKEN":"abc"}')).toContain('"[REDACTED]"')
    expect(redactText('{"access_token":"abc"}')).toBe('{"access_token":"[REDACTED]"}')
    expect(redactText('{"secret":"abc"}')).toBe('{"secret":"[REDACTED]"}')
  })

  it('leaves ordinary text untouched', () => {
    const text = 'User alice not found (HTTP 404)'
    expect(redactText(text)).toBe(text)
  })

  it('redacts multiple occurrences in the same string', () => {
    const result = redactText('Bearer aaa and also Bearer bbb')
    expect(result).toBe('Bearer [REDACTED] and also Bearer [REDACTED]')
  })
})
