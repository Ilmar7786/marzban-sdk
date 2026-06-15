import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NodeModify } from '../NodeModify.ts'
import type { NodeResponse } from '../NodeResponse.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type ModifyNodePathParams = {
  /**
   * @type integer
   */
  node_id: number
}

/**
 * NodeResponse
 * @description Successful Response
 */
export type ModifyNode200 = NodeResponse

/**
 * Unauthorized
 * @description Unauthorized
 */
export type ModifyNode401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type ModifyNode403 = Forbidden

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type ModifyNode422 = HTTPValidationError

/**
 * NodeModify
 * @example [object Object]
 */
export type ModifyNodeMutationRequest = NodeModify

export type ModifyNodeMutationResponse = ModifyNode200

export type ModifyNodeMutation = {
  Response: ModifyNode200
  Request: ModifyNodeMutationRequest
  PathParams: ModifyNodePathParams
  Errors: ModifyNode401 | ModifyNode403 | ModifyNode422
}
