import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'
import type { UserResponse } from '../UserResponse.ts'

export type GetUserPathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * @description Successful Response
 */
export type GetUser200 = UserResponse

/**
 * @description Unauthorized
 */
export type GetUser401 = Unauthorized

/**
 * @description Forbidden
 */
export type GetUser403 = Forbidden

/**
 * @description Not found
 */
export type GetUser404 = NotFound

/**
 * @description Validation Error
 */
export type GetUser422 = HTTPValidationError

export type GetUserQueryResponse = GetUser200

export type GetUserQuery = {
  Response: GetUser200
  PathParams: GetUserPathParams
  Errors: GetUser401 | GetUser403 | GetUser404 | GetUser422
}
