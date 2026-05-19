import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { SubscriptionUserResponse } from '../SubscriptionUserResponse.ts'

export type UserSubscriptionInfoPathParams = {
  /**
   * @type string
   */
  token: string
}

/**
 * @description Successful Response
 */
export type UserSubscriptionInfo200 = SubscriptionUserResponse

/**
 * @description Validation Error
 */
export type UserSubscriptionInfo422 = HTTPValidationError

export type UserSubscriptionInfoQueryResponse = UserSubscriptionInfo200

export type UserSubscriptionInfoQuery = {
  Response: UserSubscriptionInfo200
  PathParams: UserSubscriptionInfoPathParams
  Errors: UserSubscriptionInfo422
}
