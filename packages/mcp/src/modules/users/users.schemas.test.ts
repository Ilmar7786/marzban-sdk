import { describe, expect, it } from 'vitest'

import { usersExtendInputSchema } from './users.schemas'

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
