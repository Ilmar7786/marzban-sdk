import type { Forbidden } from '../Forbidden.ts'
import type { HTTPException } from '../HTTPException.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'
import type { UserModify } from '../UserModify.ts'
import type { UserResponse } from '../UserResponse.ts'

export type ModifyUserPathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * UserResponse
 * @description Successful Response
 */
export type ModifyUser200 = UserResponse

/**
 * HTTPException
 * @description Bad request
 */
export type ModifyUser400 = HTTPException

/**
 * Unauthorized
 * @description Unauthorized
 */
export type ModifyUser401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type ModifyUser403 = Forbidden

/**
 * NotFound
 * @description Not found
 */
export type ModifyUser404 = NotFound

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type ModifyUser422 = HTTPValidationError

/**
 * UserModify
 * @example [object Object]
 */
export type ModifyUserMutationRequest = UserModify

export type ModifyUserMutationResponse = ModifyUser200

export type ModifyUserMutation = {
  Response: ModifyUser200
  Request: ModifyUserMutationRequest
  PathParams: ModifyUserPathParams
  Errors: ModifyUser400 | ModifyUser401 | ModifyUser403 | ModifyUser404 | ModifyUser422
}
