import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type ActivateAllDisabledUsersPathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description Successful Response
 */
export type ActivateAllDisabledUsers200 = any

/**
 * Unauthorized
 * @description Unauthorized
 */
export type ActivateAllDisabledUsers401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type ActivateAllDisabledUsers403 = Forbidden

/**
 * NotFound
 * @description Not found
 */
export type ActivateAllDisabledUsers404 = NotFound

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type ActivateAllDisabledUsers422 = HTTPValidationError

export type ActivateAllDisabledUsersMutationResponse = ActivateAllDisabledUsers200

export type ActivateAllDisabledUsersMutation = {
  Response: ActivateAllDisabledUsers200
  PathParams: ActivateAllDisabledUsersPathParams
  Errors:
    | ActivateAllDisabledUsers401
    | ActivateAllDisabledUsers403
    | ActivateAllDisabledUsers404
    | ActivateAllDisabledUsers422
}
