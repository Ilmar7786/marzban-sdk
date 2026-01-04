import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  SetOwner401,
  SetOwner422,
  SetOwnerMutationResponse,
  SetOwnerPathParams,
  SetOwnerQueryParams,
} from '../../models/UserModel/SetOwner.ts'
import { setOwnerMutationResponseSchema } from '../../schemas/UserSchema/setOwnerSchema.ts'

function getSetOwnerUrl(username: SetOwnerPathParams['username']) {
  const res = { method: 'PUT', url: `/api/user/${username}/set-owner` as const }
  return res
}

/**
 * @description Set a new owner (admin) for a user.
 * @summary Set Owner
 * {@link /api/user/:username/set-owner}
 */
export async function setOwner(
  username: SetOwnerPathParams['username'],
  params: SetOwnerQueryParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<SetOwnerMutationResponse, ResponseErrorConfig<SetOwner401 | SetOwner422>, unknown>({
    method: 'PUT',
    url: getSetOwnerUrl(username).url.toString(),
    params,
    ...requestConfig,
  })
  return setOwnerMutationResponseSchema.parse(res.data)
}
