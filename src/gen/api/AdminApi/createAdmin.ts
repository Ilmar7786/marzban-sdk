import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  CreateAdmin401,
  CreateAdmin403,
  CreateAdmin409,
  CreateAdmin422,
  CreateAdminMutationRequest,
  CreateAdminMutationResponse,
} from '../../models/AdminModel/CreateAdmin.ts'
import {
  createAdminMutationRequestSchema,
  createAdminMutationResponseSchema,
} from '../../schemas/AdminSchema/createAdminSchema.ts'

function getCreateAdminUrl() {
  const res = {
    method: 'POST',
    url: `/api/admin` as const,
  }
  return res
}

/**
 * @description Create a new admin if the current admin has sudo privileges.
 * @summary Create Admin
 * {@link /api/admin}
 */
export async function createAdmin(
  data: CreateAdminMutationRequest,
  config: Partial<RequestConfig<CreateAdminMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = createAdminMutationRequestSchema.parse(data)
  const res = await request<
    CreateAdminMutationResponse,
    ResponseErrorConfig<CreateAdmin401 | CreateAdmin403 | CreateAdmin409 | CreateAdmin422>,
    CreateAdminMutationRequest
  >({ method: 'POST', url: getCreateAdminUrl().url.toString(), data: requestData, ...requestConfig })
  return createAdminMutationResponseSchema.parse(res.data)
}
