import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetCoreConfig401,
  GetCoreConfig403,
  GetCoreConfigQueryResponse,
} from '../../models/CoreModel/GetCoreConfig.ts'
import { getCoreConfigQueryResponseSchema } from '../../schemas/CoreSchema/getCoreConfigSchema.ts'

function getGetCoreConfigUrl() {
  const res = {
    method: 'GET',
    url: `/api/core/config` as const,
  }
  return res
}

/**
 * @description Get the current core configuration.
 * @summary Get Core Config
 * {@link /api/core/config}
 */
export async function getCoreConfig(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetCoreConfigQueryResponse,
    ResponseErrorConfig<GetCoreConfig401 | GetCoreConfig403>,
    unknown
  >({
    method: 'GET',
    url: getGetCoreConfigUrl().url.toString(),
    ...requestConfig,
  })
  return getCoreConfigQueryResponseSchema.parse(res.data)
}
