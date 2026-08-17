import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { MarzbanSDK } from '../../src/index'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { SHADOWSOCKS_PROXY } from './helpers/fixtures'
import { removeUserTolerantly } from './helpers/quirks'

// getExpiredUsers/deleteExpiredUsers act on the whole panel, not a single
// user — every assertion below checks "does/doesn't contain our fixture's
// username" rather than trusting the full result list, so leftover data
// from other integration files (or a previous failed run) can't make these
// tests flaky or, worse, silently pass by coincidence.
describe('users bulk integration (expired users, global usage reset)', () => {
  let sdk: MarzbanSDK
  const cleanup = createCleanupRegistry()

  beforeAll(async () => {
    sdk = await createTestSdk()
  })

  afterEach(async () => {
    await cleanup.runAll()
  })

  afterAll(async () => {
    await sdk.destroy()
  })

  it('finds an expired user within a date range and excludes a non-expired one', async () => {
    const expiredUsername = uniqueTestName('expired')
    const activeUsername = uniqueTestName('not-expired')
    cleanup.register(() => removeUserTolerantly(sdk, expiredUsername))
    cleanup.register(() => removeUserTolerantly(sdk, activeUsername))

    const pastExpire = Math.floor(Date.now() / 1000) - 3_600
    const futureExpire = Math.floor(Date.now() / 1000) + 86_400

    await sdk.user.addUser({
      username: expiredUsername,
      status: 'active',
      expire: pastExpire,
      proxies: SHADOWSOCKS_PROXY,
    })
    await sdk.user.addUser({
      username: activeUsername,
      status: 'active',
      expire: futureExpire,
      proxies: SHADOWSOCKS_PROXY,
    })

    // docs/marzban-quirks.md: a past expire doesn't flip `status` to
    // 'expired' synchronously, and getExpiredUsers filters by `status`, not
    // the raw `expire` field — revoke_sub is the observed way to force the
    // recalculation immediately instead of waiting on a background job.
    await sdk.user.revokeUserSubscription(expiredUsername)

    const expiredBefore = new Date().toISOString()
    const result = await sdk.user.getExpiredUsers({ expired_before: expiredBefore })

    expect(result).toContain(expiredUsername)
    expect(result).not.toContain(activeUsername)
  })

  it('returns no users for a date range with nothing expired in it', async () => {
    const result = await sdk.user.getExpiredUsers({
      expired_after: '2000-01-01T00:00:00Z',
      expired_before: '2000-01-02T00:00:00Z',
    })

    expect(result).toEqual([])
  })

  it('deletes only the users expired within the given range', async () => {
    const expiredUsername = uniqueTestName('delete-expired')
    const activeUsername = uniqueTestName('keep-active')
    cleanup.register(() => removeUserTolerantly(sdk, activeUsername))

    const pastExpire = Math.floor(Date.now() / 1000) - 3_600
    const futureExpire = Math.floor(Date.now() / 1000) + 86_400

    await sdk.user.addUser({
      username: expiredUsername,
      status: 'active',
      expire: pastExpire,
      proxies: SHADOWSOCKS_PROXY,
    })
    await sdk.user.addUser({
      username: activeUsername,
      status: 'active',
      expire: futureExpire,
      proxies: SHADOWSOCKS_PROXY,
    })
    await sdk.user.revokeUserSubscription(expiredUsername)

    const deleted = await sdk.user.deleteExpiredUsers({ expired_before: new Date().toISOString() })
    expect(deleted).toContain(expiredUsername)

    await expect(sdk.user.getUser(expiredUsername)).rejects.toMatchObject({ status: 404 })
    // The non-expired fixture must survive the bulk delete untouched.
    await expect(sdk.user.getUser(activeUsername)).resolves.toMatchObject({ username: activeUsername })
  })

  it('resets used traffic to zero for every user on the panel', async () => {
    const username = uniqueTestName('global-reset')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    await sdk.user.resetUsersDataUsage()

    const fetched = await sdk.user.getUser(username)
    expect(fetched.used_traffic).toBe(0)
  })
})
