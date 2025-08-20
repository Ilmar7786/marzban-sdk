import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  ModifyCoreConfig401,
  ModifyCoreConfig403,
  ModifyCoreConfig422,
  ModifyCoreConfigMutationRequest,
  ModifyCoreConfigMutationResponse,
} from '../../models/CoreModel/ModifyCoreConfig.ts'
import {
  modifyCoreConfigMutationRequestSchema,
  modifyCoreConfigMutationResponseSchema,
} from '../../schemas/CoreSchema/modifyCoreConfigSchema.ts'

function getModifyCoreConfigUrl() {
  const res = {
    method: 'PUT',
    url: `/api/core/config` as const,
  }
  return res
}

/**
 * @description Modify the core configuration and restart the core.
 * @summary Modify Core Config
 * {@link /api/core/config}
 */
export async function modifyCoreConfig(
  data?: ModifyCoreConfigMutationRequest,
  config: Partial<RequestConfig<ModifyCoreConfigMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = modifyCoreConfigMutationRequestSchema.parse(data)
  const res = await request<
    ModifyCoreConfigMutationResponse,
    ResponseErrorConfig<ModifyCoreConfig401 | ModifyCoreConfig403 | ModifyCoreConfig422>,
    ModifyCoreConfigMutationRequest
  >({ method: 'PUT', url: getModifyCoreConfigUrl().url.toString(), data: requestData, ...requestConfig })
  return modifyCoreConfigMutationResponseSchema.parse(res.data)
}
