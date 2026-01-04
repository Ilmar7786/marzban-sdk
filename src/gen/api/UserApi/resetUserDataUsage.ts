import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  ResetUserDataUsage401,
  ResetUserDataUsage403,
  ResetUserDataUsage404,
  ResetUserDataUsage422,
  ResetUserDataUsageMutationResponse,
  ResetUserDataUsagePathParams,
} from '../../models/UserModel/ResetUserDataUsage.ts'
import { resetUserDataUsageMutationResponseSchema } from '../../schemas/UserSchema/resetUserDataUsageSchema.ts'

function getResetUserDataUsageUrl(username: ResetUserDataUsagePathParams['username']) {
  const res = { method: 'POST', url: `/api/user/${username}/reset` as const }
  return res
}

/**
 * @description Reset user data usage
 * @summary Reset User Data Usage
 * {@link /api/user/:username/reset}
 */
export async function resetUserDataUsage(
  username: ResetUserDataUsagePathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    ResetUserDataUsageMutationResponse,
    ResponseErrorConfig<ResetUserDataUsage401 | ResetUserDataUsage403 | ResetUserDataUsage404 | ResetUserDataUsage422>,
    unknown
  >({ method: 'POST', url: getResetUserDataUsageUrl(username).url.toString(), ...requestConfig })
  return resetUserDataUsageMutationResponseSchema.parse(res.data)
}
