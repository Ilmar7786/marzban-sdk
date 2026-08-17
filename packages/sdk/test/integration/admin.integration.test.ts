import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { MarzbanSDK } from '../../src/index'
import { removeAdminTolerantly } from './helpers/adminFixture'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { SHADOWSOCKS_PROXY } from './helpers/fixtures'
import { removeUserTolerantly } from './helpers/quirks'

describe('admin integration', () => {
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

  it('returns the authenticated sudo admin from getCurrentAdmin', async () => {
    const current = await sdk.admin.getCurrentAdmin()
    expect(current.is_sudo).toBe(true)
  })

  it('creates, lists, modifies, and removes an admin (happy path)', async () => {
    const username = uniqueTestName('admin-happy')
    cleanup.register(() => removeAdminTolerantly(sdk, username))

    const created = await sdk.admin.createAdmin({ username, password: 'sdk-it-admin-password', is_sudo: false })
    expect(created.username).toBe(username)
    expect(created.is_sudo).toBe(false)

    const listed = await sdk.admin.getAdmins({ username })
    expect(listed.map(a => a.username)).toContain(username)

    // discord_webhook is validated server-side to start with
    // "https://discord.com" — telegram_id has no such format constraint.
    const modified = await sdk.admin.modifyAdmin(username, { is_sudo: false, telegram_id: 123_456_789 })
    expect(modified.telegram_id).toBe(123_456_789)

    await sdk.admin.removeAdmin(username)
    const afterRemoval = await sdk.admin.getAdmins({ username })
    expect(afterRemoval.map(a => a.username)).not.toContain(username)
  })

  it('rejects creating an admin with a username that already exists', async () => {
    const username = uniqueTestName('admin-dup')
    cleanup.register(() => removeAdminTolerantly(sdk, username))
    await sdk.admin.createAdmin({ username, password: 'sdk-it-admin-password', is_sudo: false })

    await expect(
      sdk.admin.createAdmin({ username, password: 'sdk-it-admin-password', is_sudo: false })
    ).rejects.toMatchObject({ status: 409 })
  })

  it('rejects modifying and removing an admin that does not exist', async () => {
    // adminApi.ts's ModifyAdmin/RemoveAdmin error unions don't declare 404
    // (spec gap, ADR-0003-style) — the panel returns it anyway.
    const username = uniqueTestName('admin-missing')

    await expect(sdk.admin.modifyAdmin(username, { is_sudo: false })).rejects.toMatchObject({ status: 404 })
    await expect(sdk.admin.removeAdmin(username)).rejects.toMatchObject({ status: 404 })
  })

  it('disables and re-activates every active user owned by a specific admin', async () => {
    const adminUsername = uniqueTestName('admin-scope')
    cleanup.register(() => removeAdminTolerantly(sdk, adminUsername))
    await sdk.admin.createAdmin({ username: adminUsername, password: 'sdk-it-admin-password', is_sudo: false })

    const username = uniqueTestName('owned-by-scope')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })
    await sdk.user.setOwner(username, { admin_username: adminUsername })

    await sdk.admin.disableAllActiveUsers(adminUsername)
    expect((await sdk.user.getUser(username)).status).toBe('disabled')

    await sdk.admin.activateAllDisabledUsers(adminUsername)
    expect((await sdk.user.getUser(username)).status).toBe('active')
  })

  it('rejects bulk user actions for an admin that does not exist', async () => {
    const adminUsername = uniqueTestName('admin-ghost')

    await expect(sdk.admin.disableAllActiveUsers(adminUsername)).rejects.toMatchObject({ status: 404 })
    await expect(sdk.admin.activateAllDisabledUsers(adminUsername)).rejects.toMatchObject({ status: 404 })
  })

  it('resets and reports admin usage', async () => {
    const username = uniqueTestName('admin-usage')
    cleanup.register(() => removeAdminTolerantly(sdk, username))
    await sdk.admin.createAdmin({ username, password: 'sdk-it-admin-password', is_sudo: false })

    await sdk.admin.resetAdminUsage(username)
    const usage = await sdk.admin.getAdminUsage(username)
    expect(usage).toBe(0)
  })

  it('rejects a sudo-only action (createAdmin) from a non-sudo admin session', async () => {
    const nonSudoUsername = uniqueTestName('admin-nonsudo')
    const password = 'sdk-it-admin-password'
    cleanup.register(() => removeAdminTolerantly(sdk, nonSudoUsername))
    await sdk.admin.createAdmin({ username: nonSudoUsername, password, is_sudo: false })

    const nonSudoSdk = await createTestSdk({ username: nonSudoUsername, password })
    try {
      await expect(
        nonSudoSdk.admin.createAdmin({ username: uniqueTestName('admin-blocked'), password, is_sudo: false })
      ).rejects.toMatchObject({ status: 403 })
    } finally {
      await nonSudoSdk.destroy()
    }
  })
})
