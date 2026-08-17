import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { HttpError, MarzbanSDK } from '../../src/index'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { SHADOWSOCKS_PROXY } from './helpers/fixtures'
import { removeUserTolerantly } from './helpers/quirks'
import { extractSubscriptionToken } from './helpers/subscriptionFixture'

describe('subscription integration', () => {
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

  it('returns structured subscription info matching the user it was issued for', async () => {
    const username = uniqueTestName('sub-info')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    const user = await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })
    const token = extractSubscriptionToken(user)

    const info = await sdk.subscription.userSubscriptionInfo(token)

    expect(info.username).toBe(username)
    expect(info.status).toBe('active')
    expect(info.proxies).toEqual(user.proxies)
  })

  it('returns per-node usage stats for a subscription', async () => {
    const username = uniqueTestName('sub-usage')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    const user = await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })
    const token = extractSubscriptionToken(user)

    const usage = await sdk.subscription.userGetUsage(token)

    expect(usage).toMatchObject({ username })
  })

  it('resolves the client-agnostic subscription payload', async () => {
    const username = uniqueTestName('sub-generic')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    const user = await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })
    const token = extractSubscriptionToken(user)

    // Typed `any` by userSubscription.ts — format depends on the caller's
    // user-agent (Clash, V2Ray, ...); just prove the call resolves.
    await expect(sdk.subscription.userSubscription(token)).resolves.not.toThrow()
  })

  it('resolves a subscription formatted for each supported client type', async () => {
    const username = uniqueTestName('sub-client-type')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    const user = await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })
    const token = extractSubscriptionToken(user)

    // apps/docs/content/docs/modules/subscriptions.mdx lists 'singbox' as a
    // common client type — the pattern userSubscriptionWithClientType
    // actually validates against is 'sing-box' (hyphenated). Covering it
    // here pins the real accepted value.
    for (const clientType of ['clash', 'clash-meta', 'sing-box', 'outline', 'v2ray', 'v2ray-json'] as const) {
      await expect(sdk.subscription.userSubscriptionWithClientType(clientType, token)).resolves.not.toThrow()
    }
  })

  it('rejects an unsupported client type before the panel accepts it', async () => {
    const username = uniqueTestName('sub-bad-client-type')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    const user = await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })
    const token = extractSubscriptionToken(user)

    const bogusClientType = 'sdk-it-bogus-client' as unknown as Parameters<
      typeof sdk.subscription.userSubscriptionWithClientType
    >[0]
    await expect(sdk.subscription.userSubscriptionWithClientType(bogusClientType, token)).rejects.toMatchObject({
      status: 422,
    } satisfies Partial<HttpError>)
  })

  it('rejects every subscription endpoint for an unknown token', async () => {
    const token = uniqueTestName('sub-unknown-token')

    await expect(sdk.subscription.userSubscriptionInfo(token)).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
    await expect(sdk.subscription.userGetUsage(token)).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
    await expect(sdk.subscription.userSubscriptionWithClientType('clash', token)).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
  })

  it('keeps the subscription token stable across reads and revokeUserSubscription — only the proxy credentials rotate (verified live-panel quirk)', async () => {
    // docs/marzban-quirks.md: subscription_url/token is a deterministic,
    // stable value for the user's lifetime — reads don't change it, and
    // neither does revokeUserSubscription. What revokeUserSubscription
    // actually rotates is the proxy credentials underneath it (see
    // users.integration.test.ts's "revoking a subscription rotates the
    // proxy credentials"), not the token used to reach them.
    const username = uniqueTestName('sub-revoke')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    const user = await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })
    const token = extractSubscriptionToken(user)

    await sdk.subscription.userSubscriptionInfo(token)
    await expect(sdk.subscription.userSubscriptionInfo(token)).resolves.toMatchObject({ username })

    const revoked = await sdk.user.revokeUserSubscription(username)
    expect(extractSubscriptionToken(revoked)).toBe(token)

    await expect(sdk.subscription.userSubscriptionInfo(token)).resolves.toMatchObject({ username })
  })
})
