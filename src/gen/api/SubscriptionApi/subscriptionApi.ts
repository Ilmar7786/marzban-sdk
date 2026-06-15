import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import { mergeConfig } from '@kubb/plugin-client/clients/axios'

import type {
  UserGetUsage422,
  UserGetUsagePathParams,
  UserGetUsageQueryParams,
  UserGetUsageQueryResponse,
} from '../../models/SubscriptionModel/UserGetUsage.ts'
import type {
  UserSubscription422,
  UserSubscriptionHeaderParams,
  UserSubscriptionPathParams,
  UserSubscriptionQueryResponse,
} from '../../models/SubscriptionModel/UserSubscription.ts'
import type {
  UserSubscriptionInfo422,
  UserSubscriptionInfoPathParams,
  UserSubscriptionInfoQueryResponse,
} from '../../models/SubscriptionModel/UserSubscriptionInfo.ts'
import type {
  UserSubscriptionWithClientType422,
  UserSubscriptionWithClientTypeHeaderParams,
  UserSubscriptionWithClientTypePathParams,
  UserSubscriptionWithClientTypeQueryResponse,
} from '../../models/SubscriptionModel/UserSubscriptionWithClientType.ts'
import { userGetUsageQueryResponseSchema } from '../../schemas/SubscriptionSchema/userGetUsageSchema.ts'
import { userSubscriptionInfoQueryResponseSchema } from '../../schemas/SubscriptionSchema/userSubscriptionInfoSchema.ts'
import { userSubscriptionQueryResponseSchema } from '../../schemas/SubscriptionSchema/userSubscriptionSchema.ts'
import { userSubscriptionWithClientTypeQueryResponseSchema } from '../../schemas/SubscriptionSchema/userSubscriptionWithClientTypeSchema.ts'

export class subscriptionApi {
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

  /**
   * @description Provides a subscription link based on the user agent (Clash, V2Ray, etc.).
   * @summary User Subscription
   * {@link /sub/:token/}
   */
  async userSubscription(
    token: UserSubscriptionPathParams['token'],
    headers?: UserSubscriptionHeaderParams,
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<UserSubscriptionQueryResponse, ResponseErrorConfig<UserSubscription422>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/sub/${token}/`,
      headers: { ...headers, ...requestConfig.headers },
    })
    return userSubscriptionQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Retrieves detailed information about the user's subscription.
   * @summary User Subscription Info
   * {@link /sub/:token/info}
   */
  async userSubscriptionInfo(
    token: UserSubscriptionInfoPathParams['token'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<UserSubscriptionInfoQueryResponse, ResponseErrorConfig<UserSubscriptionInfo422>, unknown>(
      { ...requestConfig, method: 'GET', url: `/sub/${token}/info` }
    )
    return userSubscriptionInfoQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Fetches the usage statistics for the user within a specified date range.
   * @summary User Get Usage
   * {@link /sub/:token/usage}
   */
  async userGetUsage(
    token: UserGetUsagePathParams['token'],
    params?: UserGetUsageQueryParams,
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<UserGetUsageQueryResponse, ResponseErrorConfig<UserGetUsage422>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/sub/${token}/usage`,
      params,
    })
    return userGetUsageQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Provides a subscription link based on the specified client type (e.g., Clash, V2Ray).
   * @summary User Subscription With Client Type
   * {@link /sub/:token/:client_type}
   */
  async userSubscriptionWithClientType(
    client_type: UserSubscriptionWithClientTypePathParams['client_type'],
    token: UserSubscriptionWithClientTypePathParams['token'],
    headers?: UserSubscriptionWithClientTypeHeaderParams,
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      UserSubscriptionWithClientTypeQueryResponse,
      ResponseErrorConfig<UserSubscriptionWithClientType422>,
      unknown
    >({
      ...requestConfig,
      method: 'GET',
      url: `/sub/${token}/${client_type}`,
      headers: { ...headers, ...requestConfig.headers },
    })
    return userSubscriptionWithClientTypeQueryResponseSchema.parse(res.data)
  }
}
