import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetUsersUsage401,
  GetUsersUsage422,
  GetUsersUsageQueryParams,
  GetUsersUsageQueryResponse,
} from '../../models/UserModel/GetUsersUsage.ts'
import { getUsersUsageQueryResponseSchema } from '../../schemas/UserSchema/getUsersUsageSchema.ts'

function getGetUsersUsageUrl() {
  const res = { method: 'GET', url: `/api/users/usage` as const }
  return res
}

/**
 * @description Get all users usage
 * @summary Get Users Usage
 * {@link /api/users/usage}
 */
export async function getUsersUsage(
  params?: GetUsersUsageQueryParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetUsersUsageQueryResponse,
    ResponseErrorConfig<GetUsersUsage401 | GetUsersUsage422>,
    unknown
  >({ method: 'GET', url: getGetUsersUsageUrl().url.toString(), params, ...requestConfig })
  return getUsersUsageQueryResponseSchema.parse(res.data)
}
