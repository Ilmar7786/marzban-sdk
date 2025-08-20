import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  GetNodeSettings401,
  GetNodeSettings403,
  GetNodeSettingsQueryResponse,
} from '../../models/NodeModel/GetNodeSettings.ts'
import { getNodeSettingsQueryResponseSchema } from '../../schemas/NodeSchema/getNodeSettingsSchema.ts'

function getGetNodeSettingsUrl() {
  const res = {
    method: 'GET',
    url: `/api/node/settings` as const,
  }
  return res
}

/**
 * @description Retrieve the current node settings, including TLS certificate.
 * @summary Get Node Settings
 * {@link /api/node/settings}
 */
export async function getNodeSettings(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetNodeSettingsQueryResponse,
    ResponseErrorConfig<GetNodeSettings401 | GetNodeSettings403>,
    unknown
  >({
    method: 'GET',
    url: getGetNodeSettingsUrl().url.toString(),
    ...requestConfig,
  })
  return getNodeSettingsQueryResponseSchema.parse(res.data)
}
