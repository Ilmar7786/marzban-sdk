import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  DeleteExpiredUsers401,
  DeleteExpiredUsers422,
  DeleteExpiredUsersMutationResponse,
  DeleteExpiredUsersQueryParams,
} from '../../models/UserModel/DeleteExpiredUsers.ts'
import { deleteExpiredUsersMutationResponseSchema } from '../../schemas/UserSchema/deleteExpiredUsersSchema.ts'

function getDeleteExpiredUsersUrl() {
  const res = { method: 'DELETE', url: `/api/users/expired` as const }
  return res
}

/**
 * @description Delete users who have expired within the specified date range.- **expired_after** UTC datetime (optional)- **expired_before** UTC datetime (optional)- At least one of expired_after or expired_before must be provided
 * @summary Delete Expired Users
 * {@link /api/users/expired}
 */
export async function deleteExpiredUsers(
  params?: DeleteExpiredUsersQueryParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    DeleteExpiredUsersMutationResponse,
    ResponseErrorConfig<DeleteExpiredUsers401 | DeleteExpiredUsers422>,
    unknown
  >({ method: 'DELETE', url: getDeleteExpiredUsersUrl().url.toString(), params, ...requestConfig })
  return deleteExpiredUsersMutationResponseSchema.parse(res.data)
}
