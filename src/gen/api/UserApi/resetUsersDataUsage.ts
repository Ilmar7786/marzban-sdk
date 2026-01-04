import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  ResetUsersDataUsage401,
  ResetUsersDataUsage403,
  ResetUsersDataUsage404,
  ResetUsersDataUsageMutationResponse,
} from '../../models/UserModel/ResetUsersDataUsage.ts'
import { resetUsersDataUsageMutationResponseSchema } from '../../schemas/UserSchema/resetUsersDataUsageSchema.ts'

function getResetUsersDataUsageUrl() {
  const res = { method: 'POST', url: `/api/users/reset` as const }
  return res
}

/**
 * @description Reset all users data usage
 * @summary Reset Users Data Usage
 * {@link /api/users/reset}
 */
export async function resetUsersDataUsage(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    ResetUsersDataUsageMutationResponse,
    ResponseErrorConfig<ResetUsersDataUsage401 | ResetUsersDataUsage403 | ResetUsersDataUsage404>,
    unknown
  >({ method: 'POST', url: getResetUsersDataUsageUrl().url.toString(), ...requestConfig })
  return resetUsersDataUsageMutationResponseSchema.parse(res.data)
}
