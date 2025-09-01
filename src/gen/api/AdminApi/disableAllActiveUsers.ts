import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  DisableAllActiveUsers401,
  DisableAllActiveUsers403,
  DisableAllActiveUsers404,
  DisableAllActiveUsers422,
  DisableAllActiveUsersMutationResponse,
  DisableAllActiveUsersPathParams,
} from '../../models/AdminModel/DisableAllActiveUsers.ts'
import { disableAllActiveUsersMutationResponseSchema } from '../../schemas/AdminSchema/disableAllActiveUsersSchema.ts'

function getDisableAllActiveUsersUrl(username: DisableAllActiveUsersPathParams['username']) {
  const res = { method: 'POST', url: `/api/admin/${username}/users/disable` as const }
  return res
}

/**
 * @description Disable all active users under a specific admin
 * @summary Disable All Active Users
 * {@link /api/admin/:username/users/disable}
 */
export async function disableAllActiveUsers(
  username: DisableAllActiveUsersPathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    DisableAllActiveUsersMutationResponse,
    ResponseErrorConfig<
      DisableAllActiveUsers401 | DisableAllActiveUsers403 | DisableAllActiveUsers404 | DisableAllActiveUsers422
    >,
    unknown
  >({ method: 'POST', url: getDisableAllActiveUsersUrl(username).url.toString(), ...requestConfig })
  return disableAllActiveUsersMutationResponseSchema.parse(res.data)
}
