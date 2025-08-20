import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type { GetCoreStats401, GetCoreStatsQueryResponse } from '../../models/CoreModel/GetCoreStats.ts'
import { getCoreStatsQueryResponseSchema } from '../../schemas/CoreSchema/getCoreStatsSchema.ts'

function getGetCoreStatsUrl() {
  const res = {
    method: 'GET',
    url: `/api/core` as const,
  }
  return res
}

/**
 * @description Retrieve core statistics such as version and uptime.
 * @summary Get Core Stats
 * {@link /api/core}
 */
export async function getCoreStats(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetCoreStatsQueryResponse, ResponseErrorConfig<GetCoreStats401>, unknown>({
    method: 'GET',
    url: getGetCoreStatsUrl().url.toString(),
    ...requestConfig,
  })
  return getCoreStatsQueryResponseSchema.parse(res.data)
}
