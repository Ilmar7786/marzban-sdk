import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type ReconnectNodePathParams = {
  /**
   * @type integer
   */
  node_id: number
}

/**
 * @description Successful Response
 */
export type ReconnectNode200 = any

/**
 * @description Unauthorized
 */
export type ReconnectNode401 = Unauthorized

/**
 * @description Forbidden
 */
export type ReconnectNode403 = Forbidden

/**
 * @description Validation Error
 */
export type ReconnectNode422 = HTTPValidationError

export type ReconnectNodeMutationResponse = ReconnectNode200

export type ReconnectNodeMutation = {
  Response: ReconnectNode200
  PathParams: ReconnectNodePathParams
  Errors: ReconnectNode401 | ReconnectNode403 | ReconnectNode422
}
