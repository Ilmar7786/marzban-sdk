import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  UserSubscriptionInfo422,
  UserSubscriptionInfoPathParams,
  UserSubscriptionInfoQueryResponse,
} from '../../models/SubscriptionModel/UserSubscriptionInfo.ts'
import { userSubscriptionInfoQueryResponseSchema } from '../../schemas/SubscriptionSchema/userSubscriptionInfoSchema.ts'

function getUserSubscriptionInfoUrl(token: UserSubscriptionInfoPathParams['token']) {
  const res = { method: 'GET', url: `/sub/${token}/info` as const }
  return res
}

/**
 * @description Retrieves detailed information about the user's subscription.
 * @summary User Subscription Info
 * {@link /sub/:token/info}
 */
export async function userSubscriptionInfo(
  token: UserSubscriptionInfoPathParams['token'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<UserSubscriptionInfoQueryResponse, ResponseErrorConfig<UserSubscriptionInfo422>, unknown>({
    method: 'GET',
    url: getUserSubscriptionInfoUrl(token).url.toString(),
    ...requestConfig,
  })
  return userSubscriptionInfoQueryResponseSchema.parse(res.data)
}
