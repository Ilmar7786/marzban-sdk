import { describe, expect, it } from 'vitest'

import {
  usersActivateOutputSchema,
  usersCreateOutputSchema,
  usersDeactivateOutputSchema,
  usersExtendInputSchema,
  usersExtendOutputSchema,
  usersGetOutputSchema,
  usersHoldOutputSchema,
  usersListOutputSchema,
  usersResetTrafficInputSchema,
  usersUpdateOutputSchema,
} from './users.schemas'

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

// #112: Marzban returns created_at (and sub_updated_at/online_at/on_hold_timeout)
// without a UTC offset. Every output schema wrapping a UserResponse must accept
// that shape — this is the parsing half of the fix; output-schema-regression.test.ts
// covers the other half (no `format` claim reaches the client in the first place).
const offsetLessUser = {
  proxies: {},
  username: 'alice',
  status: 'active' as const,
  used_traffic: 0,
  created_at: '2026-09-02T14:00:57.764445',
  sub_updated_at: null,
  online_at: '2026-09-02T14:00:57.764445',
  on_hold_timeout: null,
}

describe("output schemas accept Marzban's real, offset-less datetimes", () => {
  it('usersCreateOutputSchema / usersUpdateOutputSchema / usersActivateOutputSchema / usersDeactivateOutputSchema / usersHoldOutputSchema', () => {
    for (const schema of [
      usersCreateOutputSchema,
      usersUpdateOutputSchema,
      usersActivateOutputSchema,
      usersDeactivateOutputSchema,
      usersHoldOutputSchema,
    ]) {
      expect(schema.safeParse(offsetLessUser).success).toBe(true)
    }
  })

  it('usersGetOutputSchema', () => {
    const result = usersGetOutputSchema.safeParse({
      user: offsetLessUser,
      summary: { dataLeftBytes: null, usagePercent: null, daysLeft: null, isExpired: false },
    })
    expect(result.success).toBe(true)
  })

  it('usersListOutputSchema', () => {
    const result = usersListOutputSchema.safeParse({ users: [offsetLessUser], total: 1, note: '' })
    expect(result.success).toBe(true)
  })

  it('usersExtendOutputSchema', () => {
    const result = usersExtendOutputSchema.safeParse({ user: offsetLessUser, note: 'extended' })
    expect(result.success).toBe(true)
  })
})
