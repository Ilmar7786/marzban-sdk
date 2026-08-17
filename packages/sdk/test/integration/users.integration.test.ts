import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AuthError, createMarzbanSDK, HttpError, isHttpError, type MarzbanSDK } from '../../src/index'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { getIntegrationEnv } from './helpers/env'
import { freshConnectionConfig, removeUserTolerantly } from './helpers/quirks'

// docs/marzban-quirks.md: "addUser requires a non-empty proxies" — this is
// the one inbound local/marzban/'s bundled xray_config.json ships.
const SHADOWSOCKS_PROXY = { shadowsocks: {} }

describe('users integration', () => {
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

  it('rejects authentication with the wrong password', async () => {
    const env = getIntegrationEnv()
    await expect(
      // logger: false — this failure is expected; the SDK's default logger
      // would otherwise dump the AuthError/AxiosError to stderr on every run.
      createMarzbanSDK({ baseUrl: env.baseUrl, username: env.username, password: 'definitely-wrong', logger: false })
    ).rejects.toBeInstanceOf(AuthError)
  })

  it('creates, fetches, partially updates, and deletes a user (happy path)', async () => {
    const username = uniqueTestName('happy')
    cleanup.register(() => removeUserTolerantly(sdk, username))

    const created = await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })
    expect(created.username).toBe(username)
    expect(created.status).toBe('active')

    const fetched = await sdk.user.getUser(username)
    expect(fetched.username).toBe(username)

    // Partial PATCH semantics: only `note` is sent, everything else (status,
    // proxies, ...) must come back unchanged.
    const updated = await sdk.user.modifyUser(username, { note: 'set by integration test' })
    expect(updated.note).toBe('set by integration test')
    expect(updated.status).toBe(fetched.status)
    expect(updated.proxies).toEqual(fetched.proxies)

    await removeUserTolerantly(sdk, username)
    await expect(sdk.user.getUser(username, freshConnectionConfig())).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
  })

  it('preserves real proxy settings fields end-to-end (ADR-0003 regression)', async () => {
    // Before ADR-0003's spec patch, an under-specified `ProxySettings` schema
    // made our Zod parse silently strip every key — `proxies` would come
    // back as `{}` even though the panel actually stored password/method.
    // This asserts the live round trip still carries them.
    const username = uniqueTestName('proxies')
    cleanup.register(() => removeUserTolerantly(sdk, username))

    const created = await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    expect(created.proxies.shadowsocks).toBeDefined()
    expect(created.proxies.shadowsocks).toMatchObject({
      password: expect.any(String),
      method: expect.any(String),
    })

    const fetched = await sdk.user.getUser(username)
    expect(fetched.proxies).toEqual(created.proxies)
  })

  it('rejects creating a user with a username that already exists', async () => {
    const username = uniqueTestName('dup')
    cleanup.register(() => removeUserTolerantly(sdk, username))

    await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    await expect(sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })).rejects.toMatchObject({
      status: 409,
    } satisfies Partial<HttpError>)
  })

  it('rejects fetching, modifying a user that does not exist', async () => {
    const username = uniqueTestName('missing')

    await expect(sdk.user.getUser(username)).rejects.toMatchObject({ status: 404 } satisfies Partial<HttpError>)
    await expect(sdk.user.modifyUser(username, { note: 'x' })).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
  })

  it('normalizes data_limit=0 / expire=0 to unlimited (null) on the response', async () => {
    const username = uniqueTestName('unlimited')
    cleanup.register(() => removeUserTolerantly(sdk, username))

    const created = await sdk.user.addUser({
      username,
      status: 'active',
      data_limit: 0,
      expire: 0,
      proxies: SHADOWSOCKS_PROXY,
    })

    expect(created.data_limit).toBeNull()
    expect(created.expire).toBeNull()
  })

  it('does not synchronously flip status to expired for a past expire (Marzban recalculates lazily elsewhere)', async () => {
    // docs/marzban-quirks.md: "a past expire does not synchronously flip
    // status to expired" — a fresh GET right after creation is not enough
    // to observe 'expired'.
    const username = uniqueTestName('past-expire')
    cleanup.register(() => removeUserTolerantly(sdk, username))

    const pastExpire = Math.floor(Date.now() / 1000) - 86_400
    const created = await sdk.user.addUser({
      username,
      status: 'active',
      expire: pastExpire,
      proxies: SHADOWSOCKS_PROXY,
    })
    expect(created.status).toBe('active')

    const fetched = await sdk.user.getUser(username)
    expect(fetched.status).toBe('active')
  })

  it('resets used traffic back to zero', async () => {
    const username = uniqueTestName('reset')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    const result = await sdk.user.resetUserDataUsage(username)

    expect(result.used_traffic).toBe(0)
  })

  it('revoking a subscription rotates the proxy credentials', async () => {
    const username = uniqueTestName('revoke')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    const created = await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    const revoked = await sdk.user.revokeUserSubscription(username)

    expect(revoked.proxies.shadowsocks?.password).not.toBe(created.proxies.shadowsocks?.password)
  })

  it('finds a created user via search', async () => {
    const username = uniqueTestName('search')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    const result = await sdk.user.getUsers({ search: username })

    expect(result.users.map(u => u.username)).toContain(username)
  })

  it('deletes a user despite the panel 500ing on the report step (verified live-panel quirk)', async () => {
    const username = uniqueTestName('delete')
    await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    try {
      await sdk.user.removeUser(username, freshConnectionConfig())
      // docs/marzban-quirks.md: if a future Marzban build fixes the report
      // crash, a clean 200 is fine too.
    } catch (err) {
      expect(isHttpError(err)).toBe(true)
      expect((err as HttpError).status).toBe(500)
    }

    await expect(sdk.user.getUser(username, freshConnectionConfig())).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
  })
})
