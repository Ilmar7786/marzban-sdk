import { describe, expect, it } from 'vitest'

import { ToolError } from './mcp.error'

describe('ToolError', () => {
  it('carries code, message, and an optional hint', () => {
    const err = new ToolError('INVALID_ARGUMENTS', 'bad input', 'try again with valid args')
    expect(err.name).toBe('ToolError')
    expect(err.code).toBe('INVALID_ARGUMENTS')
    expect(err.message).toBe('bad input')
    expect(err.hint).toBe('try again with valid args')
    expect(err).toBeInstanceOf(Error)
  })

  it('leaves hint undefined when not provided', () => {
    const err = new ToolError('INTERNAL_ERROR', 'oops')
    expect(err.hint).toBeUndefined()
  })
})
