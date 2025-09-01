import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type { GetCurrentAdmin401, GetCurrentAdminQueryResponse } from '../../models/AdminModel/GetCurrentAdmin.ts'
import { getCurrentAdminQueryResponseSchema } from '../../schemas/AdminSchema/getCurrentAdminSchema.ts'

function getGetCurrentAdminUrl() {
  const res = { method: 'GET', url: `/api/admin` as const }
  return res
}

/**
 * @description Retrieve the current authenticated admin.
 * @summary Get Current Admin
 * {@link /api/admin}
 */
export async function getCurrentAdmin(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetCurrentAdminQueryResponse, ResponseErrorConfig<GetCurrentAdmin401>, unknown>({
    method: 'GET',
    url: getGetCurrentAdminUrl().url.toString(),
    ...requestConfig,
  })
  return getCurrentAdminQueryResponseSchema.parse(res.data)
}
