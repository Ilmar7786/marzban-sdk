import { AuthError, ConfigurationError, HttpError, SdkError } from 'marzban-sdk'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { ToolError } from './mcp.error'
import { toToolError } from './to-tool-error'

describe('toToolError', () => {
  it('renders a ToolError with its hint appended', () => {
    const result = toToolError(new ToolError('INVALID_ARGUMENTS', 'bad input', 'fix your args'))
    expect(result.isError).toBe(true)
    expect(result.content).toEqual([{ type: 'text', text: 'bad input\nHint: fix your args' }])
  })

  it('renders a ToolError without a hint', () => {
    const result = toToolError(new ToolError('INTERNAL_ERROR', 'oops'))
    expect(result.content).toEqual([{ type: 'text', text: 'oops' }])
  })

  it('renders a ZodError as a bulleted list of issues', () => {
    const zodError = z.object({ username: z.string() }).safeParse({}).error!
    const result = toToolError(zodError)
    expect(result.isError).toBe(true)
    const text = (result.content[0] as { text: string }).text
    expect(text).toContain('Invalid arguments:')
    expect(text).toContain('username:')
  })

  it('renders an AuthError with an actionable hint', () => {
    const result = toToolError(new AuthError('bad creds'))
    const text = (result.content[0] as { text: string }).text
    expect(text).toContain('MARZBAN_USERNAME/MARZBAN_PASSWORD')
  })

  it('renders an HttpError with its HTTP status when present', () => {
    const result = toToolError(new HttpError({ response: { status: 404 } }))
    const text = (result.content[0] as { text: string }).text
    expect(text).toContain('HTTP 404')
  })

  it('renders an HttpError without a status suffix when none is available', () => {
    const result = toToolError(new HttpError('network down'))
    const text = (result.content[0] as { text: string }).text
    expect(text).not.toMatch(/\(HTTP \d+\)/)
    expect(text).toContain('Marzban API request failed')
  })

  it.each([
    ['a non-object details value', 'just a string'],
    ['a details.response that is not an object', { response: 'nope' }],
    ['a non-numeric response.status', { response: { status: 'nope' } }],
  ])('does not crash and omits the status suffix for %s', (_label, details) => {
    const result = toToolError(new HttpError(details))
    expect(result.isError).toBe(true)
    const text = (result.content[0] as { text: string }).text
    expect(text).not.toMatch(/\(HTTP /)
  })

  it('renders a ConfigurationError with an actionable hint', () => {
    const result = toToolError(new ConfigurationError('bad config'))
    const text = (result.content[0] as { text: string }).text
    expect(text).toContain('marzban-mcp environment configuration')
  })

  it('renders a generic SdkError by code and message', () => {
    const result = toToolError(new SdkError({ code: 'SOME_CODE', message: 'generic failure' }))
    const text = (result.content[0] as { text: string }).text
    expect(text).toBe('SOME_CODE: generic failure')
  })

  it('renders a plain Error by its message', () => {
    const result = toToolError(new Error('plain failure'))
    expect((result.content[0] as { text: string }).text).toBe('plain failure')
  })

  it('renders a non-Error thrown value as an unexpected-error message', () => {
    const result = toToolError('just a string')
    expect((result.content[0] as { text: string }).text).toBe('Unexpected error: just a string')
  })

  it('redacts secrets from the final rendered text', () => {
    const result = toToolError(new Error('failed with Bearer abc123.def456'))
    expect((result.content[0] as { text: string }).text).toBe('failed with Bearer [REDACTED]')
  })
})
