import { HttpError } from 'marzban-sdk'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { ToolError } from '../errors'
import { classifyFailure } from './classify'

describe('classifyFailure', () => {
  it('treats a plain Error as not applied', () => {
    expect(classifyFailure(new Error('boom'))).toBe('not-applied')
  })

  it('treats a non-Error throw as not applied', () => {
    expect(classifyFailure('boom')).toBe('not-applied')
  })

  it('treats a schema validation failure as not applied', () => {
    const parsed = z.object({ username: z.string() }).safeParse({})
    expect(classifyFailure(parsed.error)).toBe('not-applied')
  })

  it('treats a ToolError as not applied', () => {
    expect(classifyFailure(new ToolError('INTERNAL_ERROR', 'nope'))).toBe('not-applied')
  })

  it('treats a 4xx answer from the panel as not applied', () => {
    expect(classifyFailure(new HttpError({ response: { status: 404 }, config: { method: 'delete' } }))).toBe(
      'not-applied'
    )
  })

  it('treats a 5xx answer from the panel as not applied — the panel answered, it just refused', () => {
    expect(classifyFailure(new HttpError({ response: { status: 500 }, config: { method: 'post' } }))).toBe(
      'not-applied'
    )
  })

  it('treats a failure with no request at all as not applied', () => {
    expect(classifyFailure(new HttpError('No access token after re-authentication'))).toBe('not-applied')
  })

  it('treats a non-string method as no method at all', () => {
    expect(classifyFailure(new HttpError({ config: { method: 42 } }))).toBe('not-applied')
  })

  it('treats an unanswered read as not applied — the write never started', () => {
    expect(classifyFailure(new HttpError({ config: { method: 'get' } }))).toBe('not-applied')
  })

  it('treats an unanswered POST as unknown', () => {
    expect(classifyFailure(new HttpError({ config: { method: 'post' } }))).toBe('unknown')
  })

  it('treats an unanswered DELETE as unknown', () => {
    expect(classifyFailure(new HttpError({ config: { method: 'delete' } }))).toBe('unknown')
  })
})
