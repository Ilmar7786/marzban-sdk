import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  AdminToken401,
  AdminToken422,
  AdminTokenMutationRequest,
  AdminTokenMutationResponse,
} from '../../models/AdminModel/AdminToken.ts'
import {
  adminTokenMutationRequestSchema,
  adminTokenMutationResponseSchema,
} from '../../schemas/AdminSchema/adminTokenSchema.ts'

function getAdminTokenUrl() {
  const res = { method: 'POST', url: `/api/admin/token` as const }
  return res
}

/**
 * @description Authenticate an admin and issue a token.
 * @summary Admin Token
 * {@link /api/admin/token}
 */
export async function adminToken(
  data: AdminTokenMutationRequest,
  config: Partial<RequestConfig<AdminTokenMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = adminTokenMutationRequestSchema.parse(data)

  const res = await request<
    AdminTokenMutationResponse,
    ResponseErrorConfig<AdminToken401 | AdminToken422>,
    AdminTokenMutationRequest
  >({
    method: 'POST',
    url: getAdminTokenUrl().url.toString(),
    data: requestData,
    ...requestConfig,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...requestConfig.headers },
  })
  return adminTokenMutationResponseSchema.parse(res.data)
}
