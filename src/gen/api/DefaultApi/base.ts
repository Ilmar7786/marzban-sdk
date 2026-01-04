import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type { BaseQueryResponse } from '../../models/DefaultModel/Base.ts'
import { baseQueryResponseSchema } from '../../schemas/DefaultSchema/baseSchema.ts'

function getBaseUrl() {
  const res = { method: 'GET', url: `/` as const }
  return res
}

/**
 * @summary Base
 * {@link /}
 */
export async function base(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<BaseQueryResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getBaseUrl().url.toString(),
    ...requestConfig,
  })
  return baseQueryResponseSchema.parse(res.data)
}
