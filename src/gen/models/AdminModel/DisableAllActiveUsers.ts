import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type DisableAllActiveUsersPathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description Successful Response
 */
export type DisableAllActiveUsers200 = any

/**
 * @description Unauthorized
 */
export type DisableAllActiveUsers401 = Unauthorized

/**
 * @description Forbidden
 */
export type DisableAllActiveUsers403 = Forbidden

/**
 * @description Not found
 */
export type DisableAllActiveUsers404 = NotFound

/**
 * @description Validation Error
 */
export type DisableAllActiveUsers422 = HTTPValidationError

export type DisableAllActiveUsersMutationResponse = DisableAllActiveUsers200

export type DisableAllActiveUsersMutation = {
  Response: DisableAllActiveUsers200
  PathParams: DisableAllActiveUsersPathParams
  Errors: DisableAllActiveUsers401 | DisableAllActiveUsers403 | DisableAllActiveUsers404 | DisableAllActiveUsers422
}
