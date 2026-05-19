import type { HTTPValidationError } from '../HTTPValidationError.ts'

export type UserSubscriptionWithClientTypePathParams = {
  /**
   * @pattern sing-box|clash-meta|clash|outline|v2ray|v2ray-json
   * @type string
   */
  client_type: string
  /**
   * @type string
   */
  token: string
}

export type UserSubscriptionWithClientTypeHeaderParams = {
  /**
   * @default ""
   * @type string | undefined
   */
  'user-agent'?: string
}

/**
 * @description Successful Response
 */
export type UserSubscriptionWithClientType200 = any

/**
 * @description Validation Error
 */
export type UserSubscriptionWithClientType422 = HTTPValidationError

export type UserSubscriptionWithClientTypeQueryResponse = UserSubscriptionWithClientType200

export type UserSubscriptionWithClientTypeQuery = {
  Response: UserSubscriptionWithClientType200
  PathParams: UserSubscriptionWithClientTypePathParams
  HeaderParams: UserSubscriptionWithClientTypeHeaderParams
  Errors: UserSubscriptionWithClientType422
}
