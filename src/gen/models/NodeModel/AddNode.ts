import type { Conflict } from '../Conflict.ts'
import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NodeCreate } from '../NodeCreate.ts'
import type { NodeResponse } from '../NodeResponse.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type AddNode200 = NodeResponse

/**
 * @description Unauthorized
 */
export type AddNode401 = Unauthorized

/**
 * @description Forbidden
 */
export type AddNode403 = Forbidden

/**
 * @description Conflict
 */
export type AddNode409 = Conflict

/**
 * @description Validation Error
 */
export type AddNode422 = HTTPValidationError

/**
 * @example [object Object]
 */
export type AddNodeMutationRequest = NodeCreate

export type AddNodeMutationResponse = AddNode200

export type AddNodeMutation = {
  Response: AddNode200
  Request: AddNodeMutationRequest
  Errors: AddNode401 | AddNode403 | AddNode409 | AddNode422
}
