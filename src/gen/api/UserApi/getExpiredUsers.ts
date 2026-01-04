import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  GetExpiredUsers401,
  GetExpiredUsers422,
  GetExpiredUsersQueryParams,
  GetExpiredUsersQueryResponse,
} from '../../models/UserModel/GetExpiredUsers.ts'
import { getExpiredUsersQueryResponseSchema } from '../../schemas/UserSchema/getExpiredUsersSchema.ts'

function getGetExpiredUsersUrl() {
  const res = { method: 'GET', url: `/api/users/expired` as const }
  return res
}

/**
 * @description Get users who have expired within the specified date range.- **expired_after** UTC datetime (optional)- **expired_before** UTC datetime (optional)- At least one of expired_after or expired_before must be provided for filtering- If both are omitted, returns all expired users
 * @summary Get Expired Users
 * {@link /api/users/expired}
 */
export async function getExpiredUsers(
  params?: GetExpiredUsersQueryParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetExpiredUsersQueryResponse,
    ResponseErrorConfig<GetExpiredUsers401 | GetExpiredUsers422>,
    unknown
  >({ method: 'GET', url: getGetExpiredUsersUrl().url.toString(), params, ...requestConfig })
  return getExpiredUsersQueryResponseSchema.parse(res.data)
}
