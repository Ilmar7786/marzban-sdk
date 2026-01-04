import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type { GetHosts401, GetHosts403, GetHostsQueryResponse } from '../../models/SystemModel/GetHosts.ts'
import { getHostsQueryResponseSchema } from '../../schemas/SystemSchema/getHostsSchema.ts'

function getGetHostsUrl() {
  const res = { method: 'GET', url: `/api/hosts` as const }
  return res
}

/**
 * @description Get a list of proxy hosts grouped by inbound tag.
 * @summary Get Hosts
 * {@link /api/hosts}
 */
export async function getHosts(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetHostsQueryResponse, ResponseErrorConfig<GetHosts401 | GetHosts403>, unknown>({
    method: 'GET',
    url: getGetHostsUrl().url.toString(),
    ...requestConfig,
  })
  return getHostsQueryResponseSchema.parse(res.data)
}
