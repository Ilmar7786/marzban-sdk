import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  UserSubscriptionWithClientType422,
  UserSubscriptionWithClientTypeHeaderParams,
  UserSubscriptionWithClientTypePathParams,
  UserSubscriptionWithClientTypeQueryResponse,
} from '../../models/SubscriptionModel/UserSubscriptionWithClientType.ts'
import { userSubscriptionWithClientTypeQueryResponseSchema } from '../../schemas/SubscriptionSchema/userSubscriptionWithClientTypeSchema.ts'

function getUserSubscriptionWithClientTypeUrl(
  clientType: UserSubscriptionWithClientTypePathParams['client_type'],
  token: UserSubscriptionWithClientTypePathParams['token']
) {
  const res = {
    method: 'GET',
    url: `/sub/${token}/${clientType}` as const,
  }
  return res
}

/**
 * @description Provides a subscription link based on the specified client type (e.g., Clash, V2Ray).
 * @summary User Subscription With Client Type
 * {@link /sub/:token/:client_type}
 */
export async function userSubscriptionWithClientType(
  clientType: UserSubscriptionWithClientTypePathParams['client_type'],
  token: UserSubscriptionWithClientTypePathParams['token'],
  headers?: UserSubscriptionWithClientTypeHeaderParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    UserSubscriptionWithClientTypeQueryResponse,
    ResponseErrorConfig<UserSubscriptionWithClientType422>,
    unknown
  >({
    method: 'GET',
    url: getUserSubscriptionWithClientTypeUrl(clientType, token).url.toString(),
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return userSubscriptionWithClientTypeQueryResponseSchema.parse(res.data)
}
