import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'
import type { UserResponse } from '../UserResponse.ts'

export type ResetUserDataUsagePathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * UserResponse
 * @description Successful Response
 */
export type ResetUserDataUsage200 = UserResponse

/**
 * Unauthorized
 * @description Unauthorized
 */
export type ResetUserDataUsage401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type ResetUserDataUsage403 = Forbidden

/**
 * NotFound
 * @description Not found
 */
export type ResetUserDataUsage404 = NotFound

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type ResetUserDataUsage422 = HTTPValidationError

export type ResetUserDataUsageMutationResponse = ResetUserDataUsage200

export type ResetUserDataUsageMutation = {
  Response: ResetUserDataUsage200
  PathParams: ResetUserDataUsagePathParams
  Errors: ResetUserDataUsage401 | ResetUserDataUsage403 | ResetUserDataUsage404 | ResetUserDataUsage422
}
