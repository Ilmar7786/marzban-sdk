import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  ModifyHosts401,
  ModifyHosts403,
  ModifyHosts422,
  ModifyHostsMutationRequest,
  ModifyHostsMutationResponse,
} from '../../models/SystemModel/ModifyHosts.ts'
import {
  modifyHostsMutationRequestSchema,
  modifyHostsMutationResponseSchema,
} from '../../schemas/SystemSchema/modifyHostsSchema.ts'

function getModifyHostsUrl() {
  const res = { method: 'PUT', url: `/api/hosts` as const }
  return res
}

/**
 * @description Modify proxy hosts and update the configuration.
 * @summary Modify Hosts
 * {@link /api/hosts}
 */
export async function modifyHosts(
  data?: ModifyHostsMutationRequest,
  config: Partial<RequestConfig<ModifyHostsMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = modifyHostsMutationRequestSchema.parse(data)

  const res = await request<
    ModifyHostsMutationResponse,
    ResponseErrorConfig<ModifyHosts401 | ModifyHosts403 | ModifyHosts422>,
    ModifyHostsMutationRequest
  >({ method: 'PUT', url: getModifyHostsUrl().url.toString(), data: requestData, ...requestConfig })
  return modifyHostsMutationResponseSchema.parse(res.data)
}
