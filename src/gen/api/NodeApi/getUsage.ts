import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetUsage401,
  GetUsage403,
  GetUsage422,
  GetUsageQueryParams,
  GetUsageQueryResponse,
} from '../../models/NodeModel/GetUsage.ts'
import { getUsageQueryResponseSchema } from '../../schemas/NodeSchema/getUsageSchema.ts'

function getGetUsageUrl() {
  const res = {
    method: 'GET',
    url: `/api/nodes/usage` as const,
  }
  return res
}

/**
 * @description Retrieve usage statistics for nodes within a specified date range.
 * @summary Get Usage
 * {@link /api/nodes/usage}
 */
export async function getUsage(
  params?: GetUsageQueryParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetUsageQueryResponse,
    ResponseErrorConfig<GetUsage401 | GetUsage403 | GetUsage422>,
    unknown
  >({
    method: 'GET',
    url: getGetUsageUrl().url.toString(),
    params,
    ...requestConfig,
  })
  return getUsageQueryResponseSchema.parse(res.data)
}
