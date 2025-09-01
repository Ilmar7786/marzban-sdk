import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  ResetAdminUsage401,
  ResetAdminUsage403,
  ResetAdminUsage422,
  ResetAdminUsageMutationResponse,
  ResetAdminUsagePathParams,
} from '../../models/AdminModel/ResetAdminUsage.ts'
import { resetAdminUsageMutationResponseSchema } from '../../schemas/AdminSchema/resetAdminUsageSchema.ts'

function getResetAdminUsageUrl(username: ResetAdminUsagePathParams['username']) {
  const res = { method: 'POST', url: `/api/admin/usage/reset/${username}` as const }
  return res
}

/**
 * @description Resets usage of admin.
 * @summary Reset Admin Usage
 * {@link /api/admin/usage/reset/:username}
 */
export async function resetAdminUsage(
  username: ResetAdminUsagePathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    ResetAdminUsageMutationResponse,
    ResponseErrorConfig<ResetAdminUsage401 | ResetAdminUsage403 | ResetAdminUsage422>,
    unknown
  >({ method: 'POST', url: getResetAdminUsageUrl(username).url.toString(), ...requestConfig })
  return resetAdminUsageMutationResponseSchema.parse(res.data)
}
