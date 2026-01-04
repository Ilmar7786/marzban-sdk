import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  RemoveUser401,
  RemoveUser403,
  RemoveUser404,
  RemoveUser422,
  RemoveUserMutationResponse,
  RemoveUserPathParams,
} from '../../models/UserModel/RemoveUser.ts'
import { removeUserMutationResponseSchema } from '../../schemas/UserSchema/removeUserSchema.ts'

function getRemoveUserUrl(username: RemoveUserPathParams['username']) {
  const res = { method: 'DELETE', url: `/api/user/${username}` as const }
  return res
}

/**
 * @description Remove a user
 * @summary Remove User
 * {@link /api/user/:username}
 */
export async function removeUser(
  username: RemoveUserPathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    RemoveUserMutationResponse,
    ResponseErrorConfig<RemoveUser401 | RemoveUser403 | RemoveUser404 | RemoveUser422>,
    unknown
  >({ method: 'DELETE', url: getRemoveUserUrl(username).url.toString(), ...requestConfig })
  return removeUserMutationResponseSchema.parse(res.data)
}
