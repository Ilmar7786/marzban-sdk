import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type RemoveUserPathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description Successful Response
 */
export type RemoveUser200 = any

/**
 * Unauthorized
 * @description Unauthorized
 */
export type RemoveUser401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type RemoveUser403 = Forbidden

/**
 * NotFound
 * @description Not found
 */
export type RemoveUser404 = NotFound

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type RemoveUser422 = HTTPValidationError

export type RemoveUserMutationResponse = RemoveUser200

export type RemoveUserMutation = {
  Response: RemoveUser200
  PathParams: RemoveUserPathParams
  Errors: RemoveUser401 | RemoveUser403 | RemoveUser404 | RemoveUser422
}
