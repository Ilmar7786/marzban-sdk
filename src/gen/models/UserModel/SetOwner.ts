import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'
import type { UserResponse } from '../UserResponse.ts'

export type SetOwnerPathParams = {
  /**
   * @type string
   */
  username: string
}

export type SetOwnerQueryParams = {
  /**
   * @type string
   */
  admin_username: string
}

/**
 * @description Successful Response
 */
export type SetOwner200 = UserResponse

/**
 * @description Unauthorized
 */
export type SetOwner401 = Unauthorized

/**
 * @description Validation Error
 */
export type SetOwner422 = HTTPValidationError

export type SetOwnerMutationResponse = SetOwner200

export type SetOwnerMutation = {
  Response: SetOwner200
  PathParams: SetOwnerPathParams
  QueryParams: SetOwnerQueryParams
  Errors: SetOwner401 | SetOwner422
}
