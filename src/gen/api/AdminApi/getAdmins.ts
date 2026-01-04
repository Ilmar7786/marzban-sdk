import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  GetAdmins401,
  GetAdmins403,
  GetAdmins422,
  GetAdminsQueryParams,
  GetAdminsQueryResponse,
} from '../../models/AdminModel/GetAdmins.ts'
import { getAdminsQueryResponseSchema } from '../../schemas/AdminSchema/getAdminsSchema.ts'

function getGetAdminsUrl() {
  const res = { method: 'GET', url: `/api/admins` as const }
  return res
}

/**
 * @description Fetch a list of admins with optional filters for pagination and username.
 * @summary Get Admins
 * {@link /api/admins}
 */
export async function getAdmins(
  params?: GetAdminsQueryParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    GetAdminsQueryResponse,
    ResponseErrorConfig<GetAdmins401 | GetAdmins403 | GetAdmins422>,
    unknown
  >({ method: 'GET', url: getGetAdminsUrl().url.toString(), params, ...requestConfig })
  return getAdminsQueryResponseSchema.parse(res.data)
}
