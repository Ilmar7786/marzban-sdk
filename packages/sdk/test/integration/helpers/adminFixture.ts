import { isHttpError, type MarzbanSDK } from '../../../src/index'
import { uniqueTestName } from './cleanup'

/** Creates a test admin fixture; returns its credentials for building a scoped SDK session. */
export async function createTestAdmin(
  sdk: MarzbanSDK,
  options: { isSudo?: boolean } = {}
): Promise<{ username: string; password: string }> {
  const username = uniqueTestName('admin')
  const password = 'sdk-it-admin-password'

  await sdk.admin.createAdmin({ username, password, is_sudo: options.isSudo ?? false })

  return { username, password }
}

/** `removeAdmin` counterpart to {@link removeUserTolerantly} — swallows "already gone", not a known 500 quirk here. */
export async function removeAdminTolerantly(sdk: MarzbanSDK, username: string): Promise<void> {
  try {
    await sdk.admin.removeAdmin(username)
  } catch (err) {
    if (isHttpError(err) && (err.status === 404 || err.status === 403)) return
    throw err
  }
}
