import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type RemoveAdminPathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description Successful Response
 */
export type RemoveAdmin200 = any

/**
 * @description Unauthorized
 */
export type RemoveAdmin401 = Unauthorized

/**
 * @description Forbidden
 */
export type RemoveAdmin403 = Forbidden

/**
 * @description Validation Error
 */
export type RemoveAdmin422 = HTTPValidationError

export type RemoveAdminMutationResponse = RemoveAdmin200

export type RemoveAdminMutation = {
  Response: RemoveAdmin200
  PathParams: RemoveAdminPathParams
  Errors: RemoveAdmin401 | RemoveAdmin403 | RemoveAdmin422
}
