import { describe, expect, it } from 'vitest'

import { usersExtendInputSchema, usersResetTrafficInputSchema } from './users.schemas'

describe('usersExtendInputSchema', () => {
  it('accepts addDuration alone', () => {
    expect(usersExtendInputSchema.safeParse({ username: 'alice', addDuration: '30d' }).success).toBe(true)
  })

  it('accepts addData alone', () => {
    expect(usersExtendInputSchema.safeParse({ username: 'alice', addData: '10GB' }).success).toBe(true)
  })

  it('accepts both together', () => {
    expect(usersExtendInputSchema.safeParse({ username: 'alice', addDuration: '30d', addData: '10GB' }).success).toBe(
      true
    )
  })

  it('rejects when neither addDuration nor addData is provided', () => {
    const result = usersExtendInputSchema.safeParse({ username: 'alice' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('Provide addDuration and/or addData')
  })
})

describe('usersResetTrafficInputSchema', () => {
  it('accepts a username without all', () => {
    expect(usersResetTrafficInputSchema.safeParse({ username: 'alice' }).success).toBe(true)
  })

  it('accepts all=true without a username', () => {
    expect(usersResetTrafficInputSchema.safeParse({ all: true }).success).toBe(true)
  })

  it('rejects when neither username nor all=true is provided', () => {
    const result = usersResetTrafficInputSchema.safeParse({})
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('Provide either username, or all=true')
  })
})
