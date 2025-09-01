import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type { GetSystemStats401, GetSystemStatsQueryResponse } from '../../models/SystemModel/GetSystemStats.ts'
import { getSystemStatsQueryResponseSchema } from '../../schemas/SystemSchema/getSystemStatsSchema.ts'

function getGetSystemStatsUrl() {
  const res = { method: 'GET', url: `/api/system` as const }
  return res
}

/**
 * @description Fetch system stats including memory, CPU, and user metrics.
 * @summary Get System Stats
 * {@link /api/system}
 */
export async function getSystemStats(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetSystemStatsQueryResponse, ResponseErrorConfig<GetSystemStats401>, unknown>({
    method: 'GET',
    url: getGetSystemStatsUrl().url.toString(),
    ...requestConfig,
  })
  return getSystemStatsQueryResponseSchema.parse(res.data)
}
