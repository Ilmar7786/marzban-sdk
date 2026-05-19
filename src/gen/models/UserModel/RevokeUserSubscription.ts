import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'
import type { UserResponse } from '../UserResponse.ts'

export type RevokeUserSubscriptionPathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description Successful Response
 */
export type RevokeUserSubscription200 = UserResponse

/**
 * @description Unauthorized
 */
export type RevokeUserSubscription401 = Unauthorized

/**
 * @description Forbidden
 */
export type RevokeUserSubscription403 = Forbidden

/**
 * @description Not found
 */
export type RevokeUserSubscription404 = NotFound

/**
 * @description Validation Error
 */
export type RevokeUserSubscription422 = HTTPValidationError

export type RevokeUserSubscriptionMutationResponse = RevokeUserSubscription200

export type RevokeUserSubscriptionMutation = {
  Response: RevokeUserSubscription200
  PathParams: RevokeUserSubscriptionPathParams
  Errors: RevokeUserSubscription401 | RevokeUserSubscription403 | RevokeUserSubscription404 | RevokeUserSubscription422
}
