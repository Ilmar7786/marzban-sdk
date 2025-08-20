import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetAdminUsage401,
  GetAdminUsage403,
  GetAdminUsage422,
  GetAdminUsagePathParams,
  GetAdminUsageQueryResponse,
} from '../../models/AdminModel/GetAdminUsage.ts'
import { getAdminUsageQueryResponseSchema } from '../../schemas/AdminSchema/getAdminUsageSchema.ts'

function getGetAdminUsageUrl(username: GetAdminUsagePathParams['username']) {
  const res = {
    method: 'GET',
    url: `/api/admin/usage/${username}` as const,
  }
  return res
}

/**
 * @description Retrieve the usage of given admin.
 * @summary Get Admin Usage
 * {@link /api/admin/usage/:username}
 */
export async function getAdminUsage(
  username: GetAdminUsagePathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetAdminUsageQueryResponse,
    ResponseErrorConfig<GetAdminUsage401 | GetAdminUsage403 | GetAdminUsage422>,
    unknown
  >({
    method: 'GET',
    url: getGetAdminUsageUrl(username).url.toString(),
    ...requestConfig,
  })
  return getAdminUsageQueryResponseSchema.parse(res.data)
}
