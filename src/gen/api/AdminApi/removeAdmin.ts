import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  RemoveAdmin401,
  RemoveAdmin403,
  RemoveAdmin422,
  RemoveAdminMutationResponse,
  RemoveAdminPathParams,
} from '../../models/AdminModel/RemoveAdmin.ts'
import { removeAdminMutationResponseSchema } from '../../schemas/AdminSchema/removeAdminSchema.ts'

function getRemoveAdminUrl(username: RemoveAdminPathParams['username']) {
  const res = { method: 'DELETE', url: `/api/admin/${username}` as const }
  return res
}

/**
 * @description Remove an admin from the database.
 * @summary Remove Admin
 * {@link /api/admin/:username}
 */
export async function removeAdmin(
  username: RemoveAdminPathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    RemoveAdminMutationResponse,
    ResponseErrorConfig<RemoveAdmin401 | RemoveAdmin403 | RemoveAdmin422>,
    unknown
  >({ method: 'DELETE', url: getRemoveAdminUrl(username).url.toString(), ...requestConfig })
  return removeAdminMutationResponseSchema.parse(res.data)
}
