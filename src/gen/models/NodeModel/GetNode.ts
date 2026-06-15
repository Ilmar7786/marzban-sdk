import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NodeResponse } from '../NodeResponse.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type GetNodePathParams = {
  /**
   * @type integer
   */
  node_id: number
}

/**
 * NodeResponse
 * @description Successful Response
 */
export type GetNode200 = NodeResponse

/**
 * Unauthorized
 * @description Unauthorized
 */
export type GetNode401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type GetNode403 = Forbidden

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type GetNode422 = HTTPValidationError

export type GetNodeQueryResponse = GetNode200

export type GetNodeQuery = {
  Response: GetNode200
  PathParams: GetNodePathParams
  Errors: GetNode401 | GetNode403 | GetNode422
}
