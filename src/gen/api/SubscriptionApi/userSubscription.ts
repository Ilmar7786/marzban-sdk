import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  UserSubscription422,
  UserSubscriptionHeaderParams,
  UserSubscriptionPathParams,
  UserSubscriptionQueryResponse,
} from '../../models/SubscriptionModel/UserSubscription.ts'
import { userSubscriptionQueryResponseSchema } from '../../schemas/SubscriptionSchema/userSubscriptionSchema.ts'

function getUserSubscriptionUrl(token: UserSubscriptionPathParams['token']) {
  const res = { method: 'GET', url: `/sub/${token}/` as const }
  return res
}

/**
 * @description Provides a subscription link based on the user agent (Clash, V2Ray, etc.).
 * @summary User Subscription
 * {@link /sub/:token/}
 */
export async function userSubscription(
  token: UserSubscriptionPathParams['token'],
  headers?: UserSubscriptionHeaderParams,
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<UserSubscriptionQueryResponse, ResponseErrorConfig<UserSubscription422>, unknown>({
    method: 'GET',
    url: getUserSubscriptionUrl(token).url.toString(),
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })
  return userSubscriptionQueryResponseSchema.parse(res.data)
}
