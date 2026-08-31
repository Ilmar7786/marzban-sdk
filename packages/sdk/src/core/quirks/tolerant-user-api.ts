import type { Client, RequestConfig } from '@kubb/plugin-client/clients/axios'

import { userApi } from '@/gen/api'
import type { RemoveUserPathParams } from '@/gen/models/UserModel/RemoveUser'

import { isHttpError } from '../errors'

/**
 * `userApi` with the `DELETE /api/user/{username}` 500-despite-success quirk
 * absorbed — see docs/marzban-quirks.md. Marzban deletes the user, then
 * crashes building an unrelated deletion report before it can send the
 * response. A 500 from `removeUser` is only treated as success once a
 * follow-up `getUser` confirms the user is actually gone (404) — a genuine
 * failure (user still exists, or the confirmation itself can't be made)
 * still throws the original error.
 */
export class TolerantUserApi extends userApi {
  async removeUser(
    username: RemoveUserPathParams['username'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    try {
      return await super.removeUser(username, config)
    } catch (err) {
      if (!isHttpError(err) || err.status !== 500) throw err
      if (await this.stillExists(username, config)) throw err
      return { detail: 'User successfully deleted' }
    }
  }

  private async stillExists(
    username: RemoveUserPathParams['username'],
    config: Partial<RequestConfig> & { client?: Client }
  ): Promise<boolean> {
    try {
      await this.getUser(username, config)
      return true
    } catch (err) {
      return !(isHttpError(err) && err.status === 404)
    }
  }
}
