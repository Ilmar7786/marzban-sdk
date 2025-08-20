import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetUserUsage401,
  GetUserUsage403,
  GetUserUsage404,
  GetUserUsage422,
  GetUserUsagePathParams,
  GetUserUsageQueryParams,
  GetUserUsageQueryResponse,
} from '../../models/UserModel/GetUserUsage.ts'
import { getUserUsageQueryResponseSchema } from '../../schemas/UserSchema/getUserUsageSchema.ts'

function getGetUserUsageUrl(username: GetUserUsagePathParams['username']) {
  const res = {
    method: 'GET',
    url: `/api/user/${username}/usage` as const,
  }
  return res
}

/**
 * @description Get users usage
 * @summary Get User Usage
 * {@link /api/user/:username/usage}
 */
export async function getUserUsage(
  username: GetUserUsagePathParams['username'],
  params?: GetUserUsageQueryParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetUserUsageQueryResponse,
    ResponseErrorConfig<GetUserUsage401 | GetUserUsage403 | GetUserUsage404 | GetUserUsage422>,
    unknown
  >({
    method: 'GET',
    url: getGetUserUsageUrl(username).url.toString(),
    params,
    ...requestConfig,
  })
  return getUserUsageQueryResponseSchema.parse(res.data)
}
