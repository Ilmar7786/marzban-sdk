import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type RemoveNodePathParams = {
  /**
   * @type integer
   */
  node_id: number
}

/**
 * @description Successful Response
 */
export type RemoveNode200 = any

/**
 * Unauthorized
 * @description Unauthorized
 */
export type RemoveNode401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type RemoveNode403 = Forbidden

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type RemoveNode422 = HTTPValidationError

export type RemoveNodeMutationResponse = RemoveNode200

export type RemoveNodeMutation = {
  Response: RemoveNode200
  PathParams: RemoveNodePathParams
  Errors: RemoveNode401 | RemoveNode403 | RemoveNode422
}
