import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  ActivateAllDisabledUsers401,
  ActivateAllDisabledUsers403,
  ActivateAllDisabledUsers404,
  ActivateAllDisabledUsers422,
  ActivateAllDisabledUsersMutationResponse,
  ActivateAllDisabledUsersPathParams,
} from '../../models/AdminModel/ActivateAllDisabledUsers.ts'
import { activateAllDisabledUsersMutationResponseSchema } from '../../schemas/AdminSchema/activateAllDisabledUsersSchema.ts'

function getActivateAllDisabledUsersUrl(username: ActivateAllDisabledUsersPathParams['username']) {
  const res = { method: 'POST', url: `/api/admin/${username}/users/activate` as const }
  return res
}

/**
 * @description Activate all disabled users under a specific admin
 * @summary Activate All Disabled Users
 * {@link /api/admin/:username/users/activate}
 */
export async function activateAllDisabledUsers(
  username: ActivateAllDisabledUsersPathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    ActivateAllDisabledUsersMutationResponse,
    ResponseErrorConfig<
      | ActivateAllDisabledUsers401
      | ActivateAllDisabledUsers403
      | ActivateAllDisabledUsers404
      | ActivateAllDisabledUsers422
    >,
    unknown
  >({ method: 'POST', url: getActivateAllDisabledUsersUrl(username).url.toString(), ...requestConfig })
  return activateAllDisabledUsersMutationResponseSchema.parse(res.data)
}
