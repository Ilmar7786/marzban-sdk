import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  ModifyAdmin401,
  ModifyAdmin403,
  ModifyAdmin422,
  ModifyAdminMutationRequest,
  ModifyAdminMutationResponse,
  ModifyAdminPathParams,
} from '../../models/AdminModel/ModifyAdmin.ts'
import {
  modifyAdminMutationRequestSchema,
  modifyAdminMutationResponseSchema,
} from '../../schemas/AdminSchema/modifyAdminSchema.ts'

function getModifyAdminUrl(username: ModifyAdminPathParams['username']) {
  const res = { method: 'PUT', url: `/api/admin/${username}` as const }
  return res
}

/**
 * @description Modify an existing admin's details.
 * @summary Modify Admin
 * {@link /api/admin/:username}
 */
export async function modifyAdmin(
  username: ModifyAdminPathParams['username'],
  data: ModifyAdminMutationRequest,
  config: Partial<RequestConfig<ModifyAdminMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = modifyAdminMutationRequestSchema.parse(data)

  const res = await request<
    ModifyAdminMutationResponse,
    ResponseErrorConfig<ModifyAdmin401 | ModifyAdmin403 | ModifyAdmin422>,
    ModifyAdminMutationRequest
  >({ method: 'PUT', url: getModifyAdminUrl(username).url.toString(), data: requestData, ...requestConfig })
  return modifyAdminMutationResponseSchema.parse(res.data)
}
