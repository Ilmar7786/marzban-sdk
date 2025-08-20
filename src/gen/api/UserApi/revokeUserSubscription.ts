import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  RevokeUserSubscription401,
  RevokeUserSubscription403,
  RevokeUserSubscription404,
  RevokeUserSubscription422,
  RevokeUserSubscriptionMutationResponse,
  RevokeUserSubscriptionPathParams,
} from '../../models/UserModel/RevokeUserSubscription.ts'
import { revokeUserSubscriptionMutationResponseSchema } from '../../schemas/UserSchema/revokeUserSubscriptionSchema.ts'

function getRevokeUserSubscriptionUrl(username: RevokeUserSubscriptionPathParams['username']) {
  const res = {
    method: 'POST',
    url: `/api/user/${username}/revoke_sub` as const,
  }
  return res
}

/**
 * @description Revoke users subscription (Subscription link and proxies)
 * @summary Revoke User Subscription
 * {@link /api/user/:username/revoke_sub}
 */
export async function revokeUserSubscription(
  username: RevokeUserSubscriptionPathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    RevokeUserSubscriptionMutationResponse,
    ResponseErrorConfig<
      RevokeUserSubscription401 | RevokeUserSubscription403 | RevokeUserSubscription404 | RevokeUserSubscription422
    >,
    unknown
  >({ method: 'POST', url: getRevokeUserSubscriptionUrl(username).url.toString(), ...requestConfig })
  return revokeUserSubscriptionMutationResponseSchema.parse(res.data)
}
