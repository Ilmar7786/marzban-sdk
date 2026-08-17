import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { isHttpError, type MarzbanSDK } from '../../src/index'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { SHADOWSOCKS_PROXY } from './helpers/fixtures'
import { freshConnectionConfig, removeUserTolerantly } from './helpers/quirks'

describe('users lifecycle integration (next_plan, on_hold)', () => {
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

  it('applies a queued next_plan and clears it, despite the panel 404ing on the call itself (verified live-panel quirk)', async () => {
    // docs/marzban-quirks.md: activeNextPlan reliably 404s with "User
    // doesn't have next plan" even when a next_plan was queued and gets
    // applied anyway — confirm the outcome via a follow-up GET, not via
    // this call resolving (same shape as the DELETE /api/user 500 quirk).
    const username = uniqueTestName('next-plan')
    cleanup.register(() => removeUserTolerantly(sdk, username))

    const futureExpire = Math.floor(Date.now() / 1000) + 86_400
    const nextExpire = Math.floor(Date.now() / 1000) + 172_800
    const nextDataLimit = 2_147_483_648 // 2GB

    await sdk.user.addUser({
      username,
      status: 'active',
      data_limit: 1_073_741_824, // 1GB
      expire: futureExpire,
      proxies: SHADOWSOCKS_PROXY,
      // add_remaining_traffic: true observed to replace data_limit outright
      // with the next plan's value — false was observed to sum old+new,
      // which is surprising enough to not want as this test's assertion.
      next_plan: { data_limit: nextDataLimit, expire: nextExpire, add_remaining_traffic: true },
    })

    try {
      await sdk.user.activeNextPlan(username, freshConnectionConfig())
    } catch (err) {
      expect(isHttpError(err)).toBe(true)
      expect((err as { status?: number }).status).toBe(404)
    }

    const fetched = await sdk.user.getUser(username, freshConnectionConfig())
    expect(fetched.data_limit).toBe(nextDataLimit)
    expect(fetched.expire).toBe(nextExpire)
    expect(fetched.next_plan).toBeFalsy()
  })

  it('leaves data_limit/expire untouched when activating a next_plan on a user that has none queued', async () => {
    const username = uniqueTestName('no-next-plan')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    const dataLimit = 1_073_741_824
    const expire = Math.floor(Date.now() / 1000) + 86_400
    await sdk.user.addUser({ username, status: 'active', data_limit: dataLimit, expire, proxies: SHADOWSOCKS_PROXY })

    await expect(sdk.user.activeNextPlan(username, freshConnectionConfig())).rejects.toMatchObject({ status: 404 })

    // Unlike the queued-plan case above, nothing should have changed —
    // this proves the 404 above really means "nothing to apply" here,
    // rather than being the same silent-success quirk.
    const fetched = await sdk.user.getUser(username, freshConnectionConfig())
    expect(fetched.data_limit).toBe(dataLimit)
    expect(fetched.expire).toBe(expire)
  })

  it('creates an on_hold user with on_hold_timeout and on_hold_expire_duration, and allows transition to active', async () => {
    const username = uniqueTestName('on-hold')
    cleanup.register(() => removeUserTolerantly(sdk, username))

    const onHoldTimeout = new Date(Date.now() + 86_400_000).toISOString()
    const onHoldExpireDuration = 3_600

    const created = await sdk.user.addUser({
      username,
      status: 'on_hold',
      on_hold_timeout: onHoldTimeout,
      on_hold_expire_duration: onHoldExpireDuration,
      proxies: SHADOWSOCKS_PROXY,
    })

    expect(created.status).toBe('on_hold')
    expect(created.on_hold_expire_duration).toBe(onHoldExpireDuration)

    const activated = await sdk.user.modifyUser(username, { status: 'active' })
    expect(activated.status).toBe('active')
  })
})
