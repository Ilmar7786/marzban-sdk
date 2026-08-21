import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { MarzbanSDK } from '../../src/index'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { SHADOWSOCKS_PROXY } from './helpers/fixtures'
import { removeUserTolerantly } from './helpers/quirks'

describe('users listing integration (getUsers pagination/filter/sort, usage)', () => {
  let sdk: MarzbanSDK
  const cleanup = createCleanupRegistry()

  // Shared fixture group for the pagination/filter/sort tests below —
  // three users, one of them disabled, all queried by explicit `username`
  // filter so results never depend on what else exists on the panel.
  let usernames: string[]
  let disabledUsername: string

  beforeAll(async () => {
    sdk = await createTestSdk()

    usernames = [uniqueTestName('list-a'), uniqueTestName('list-b'), uniqueTestName('list-c')]
    disabledUsername = usernames[1]!

    for (const username of usernames) {
      cleanup.register(() => removeUserTolerantly(sdk, username))
      // addUser only accepts 'active' | 'on_hold' (UserStatusCreate) —
      // 'disabled' has to be set via a follow-up modifyUser.
      await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })
    }
    await sdk.user.modifyUser(disabledUsername, { status: 'disabled' })
  })

  afterAll(async () => {
    await cleanup.runAll()
    await sdk.destroy()
  })

  it('paginates a filtered set without gaps or duplicates', async () => {
    const page1 = await sdk.user.getUsers({ username: usernames, limit: 2, offset: 0, sort: 'username' })
    const page2 = await sdk.user.getUsers({ username: usernames, limit: 2, offset: 2, sort: 'username' })

    const combined = [...page1.users, ...page2.users].map(u => u.username)
    expect(new Set(combined)).toEqual(new Set(usernames))
    expect(combined).toHaveLength(usernames.length)
  })

  it('filters by status', async () => {
    const disabled = await sdk.user.getUsers({ username: usernames, status: 'disabled' })
    expect(disabled.users.map(u => u.username)).toEqual([disabledUsername])

    const active = await sdk.user.getUsers({ username: usernames, status: 'active' })
    expect(active.users.map(u => u.username).sort()).toEqual(usernames.filter(u => u !== disabledUsername).sort())
  })

  it('sorts ascending and descending by username', async () => {
    const ascending = await sdk.user.getUsers({ username: usernames, sort: 'username' })
    const descending = await sdk.user.getUsers({ username: usernames, sort: '-username' })

    expect(ascending.users.map(u => u.username)).toEqual([...usernames].sort())
    expect(descending.users.map(u => u.username)).toEqual([...usernames].sort().reverse())
  })

  it('reports zero usage on every node for a user with no traffic', async () => {
    // One entry per configured node (here, just "Master") rather than an
    // empty array — the panel always reports the full node set.
    const usage = await sdk.user.getUserUsage(usernames[0]!)
    expect(usage.username).toBe(usernames[0])
    expect(usage.usages.length).toBeGreaterThan(0)
    expect(usage.usages.every(u => u.used_traffic === 0)).toBe(true)
  })

  it('aggregates usage across the whole panel without error', async () => {
    // Global, not scoped to our fixtures (docs/marzban-quirks.md-style caveat:
    // `local/marzban/` is also used for ad hoc manual poking, so unlike the
    // other assertions in this file we can't assert an exact/empty result).
    const usage = await sdk.user.getUsersUsage()
    expect(Array.isArray(usage.usages)).toBe(true)
  })
})
