import type { HTTPValidationError } from '../HTTPValidationError.ts'

export type UserSubscriptionPathParams = {
  /**
   * @type string
   */
  token: string
}

export type UserSubscriptionHeaderParams = {
  /**
   * @default ""
   * @type string | undefined
   */
  'user-agent'?: string
}

/**
 * @description Successful Response
 */
export type UserSubscription200 = any

/**
 * @description Validation Error
 */
export type UserSubscription422 = HTTPValidationError

export type UserSubscriptionQueryResponse = UserSubscription200

export type UserSubscriptionQuery = {
  Response: UserSubscription200
  PathParams: UserSubscriptionPathParams
  HeaderParams: UserSubscriptionHeaderParams
  Errors: UserSubscription422
}
