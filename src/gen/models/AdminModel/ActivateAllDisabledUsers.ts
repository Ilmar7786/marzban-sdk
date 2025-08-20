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
 * @description Unauthorized
 */
export type ActivateAllDisabledUsers401 = Unauthorized

/**
 * @description Forbidden
 */
export type ActivateAllDisabledUsers403 = Forbidden

/**
 * @description Not found
 */
export type ActivateAllDisabledUsers404 = NotFound

/**
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
