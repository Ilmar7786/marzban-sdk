import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  UserGetUsage422,
  UserGetUsagePathParams,
  UserGetUsageQueryParams,
  UserGetUsageQueryResponse,
} from '../../models/SubscriptionModel/UserGetUsage.ts'
import { userGetUsageQueryResponseSchema } from '../../schemas/SubscriptionSchema/userGetUsageSchema.ts'

function getUserGetUsageUrl(token: UserGetUsagePathParams['token']) {
  const res = {
    method: 'GET',
    url: `/sub/${token}/usage` as const,
  }
  return res
}

/**
 * @description Fetches the usage statistics for the user within a specified date range.
 * @summary User Get Usage
 * {@link /sub/:token/usage}
 */
export async function userGetUsage(
  token: UserGetUsagePathParams['token'],
  params?: UserGetUsageQueryParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<UserGetUsageQueryResponse, ResponseErrorConfig<UserGetUsage422>, unknown>({
    method: 'GET',
    url: getUserGetUsageUrl(token).url.toString(),
    params,
    ...requestConfig,
  })
  return userGetUsageQueryResponseSchema.parse(res.data)
}
