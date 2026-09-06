import { describe, expect, it } from 'vitest'

import { subscriptionInfoOutputSchema, usersRevokeSubscriptionOutputSchema } from './subscription.schemas'

// #112: Marzban returns created_at (and sub_updated_at/online_at/on_hold_timeout)
// without a UTC offset — both output schemas here wrap a full user response and
// must accept that shape. See users.schemas.test.ts for the same check on the
// users module, and output-schema-regression.test.ts for the JSON-Schema-level
// guarantee that no `format` claim reaches the client in the first place.
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
  it('subscriptionInfoOutputSchema', () => {
    expect(subscriptionInfoOutputSchema.safeParse(offsetLessUser).success).toBe(true)
  })

  it('usersRevokeSubscriptionOutputSchema', () => {
    expect(usersRevokeSubscriptionOutputSchema.safeParse(offsetLessUser).success).toBe(true)
  })
})
