import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { MarzbanSDK } from '../../src/index'
import { createTestAdmin, removeAdminTolerantly } from './helpers/adminFixture'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { SHADOWSOCKS_PROXY } from './helpers/fixtures'
import { removeUserTolerantly } from './helpers/quirks'

describe('users ownership integration (setOwner)', () => {
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

  it('reassigns a user to a different admin', async () => {
    const username = uniqueTestName('owned')
    cleanup.register(() => removeUserTolerantly(sdk, username))

    const newAdmin = await createTestAdmin(sdk)
    cleanup.register(() => removeAdminTolerantly(sdk, newAdmin.username))

    await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    const reassigned = await sdk.user.setOwner(username, { admin_username: newAdmin.username })
    expect(reassigned.admin?.username).toBe(newAdmin.username)

    const fetched = await sdk.user.getUser(username)
    expect(fetched.admin?.username).toBe(newAdmin.username)
  })

  it('rejects reassigning a user to a nonexistent admin', async () => {
    const username = uniqueTestName('owned-missing')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    await expect(sdk.user.setOwner(username, { admin_username: uniqueTestName('ghost-admin') })).rejects.toMatchObject({
      status: 404,
    })
  })
})
