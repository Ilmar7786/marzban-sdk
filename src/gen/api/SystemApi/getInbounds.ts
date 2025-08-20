import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type { GetInbounds401, GetInboundsQueryResponse } from '../../models/SystemModel/GetInbounds.ts'
import { getInboundsQueryResponseSchema } from '../../schemas/SystemSchema/getInboundsSchema.ts'

function getGetInboundsUrl() {
  const res = {
    method: 'GET',
    url: `/api/inbounds` as const,
  }
  return res
}

/**
 * @description Retrieve inbound configurations grouped by protocol.
 * @summary Get Inbounds
 * {@link /api/inbounds}
 */
export async function getInbounds(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetInboundsQueryResponse, ResponseErrorConfig<GetInbounds401>, unknown>({
    method: 'GET',
    url: getGetInboundsUrl().url.toString(),
    ...requestConfig,
  })
  return getInboundsQueryResponseSchema.parse(res.data)
}
