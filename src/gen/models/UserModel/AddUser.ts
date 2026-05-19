import type { Conflict } from '../Conflict.ts'
import type { HTTPException } from '../HTTPException.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'
import type { UserCreate } from '../UserCreate.ts'
import type { UserResponse } from '../UserResponse.ts'

/**
 * @description Successful Response
 */
export type AddUser200 = UserResponse

/**
 * @description Bad request
 */
export type AddUser400 = HTTPException

/**
 * @description Unauthorized
 */
export type AddUser401 = Unauthorized

/**
 * @description Conflict
 */
export type AddUser409 = Conflict

/**
 * @description Validation Error
 */
export type AddUser422 = HTTPValidationError

/**
 * @example [object Object]
 */
export type AddUserMutationRequest = UserCreate

export type AddUserMutationResponse = AddUser200

export type AddUserMutation = {
  Response: AddUser200
  Request: AddUserMutationRequest
  Errors: AddUser400 | AddUser401 | AddUser409 | AddUser422
}
