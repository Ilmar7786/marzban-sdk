import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NodesUsageResponse } from '../NodesUsageResponse.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type GetUsageQueryParams = {
  /**
   * @default ""
   * @type string | undefined
   */
  start?: string
  /**
   * @default ""
   * @type string | undefined
   */
  end?: string
}

/**
 * @description Successful Response
 */
export type GetUsage200 = NodesUsageResponse

/**
 * @description Unauthorized
 */
export type GetUsage401 = Unauthorized

/**
 * @description Forbidden
 */
export type GetUsage403 = Forbidden

/**
 * @description Validation Error
 */
export type GetUsage422 = HTTPValidationError

export type GetUsageQueryResponse = GetUsage200

export type GetUsageQuery = {
  Response: GetUsage200
  QueryParams: GetUsageQueryParams
  Errors: GetUsage401 | GetUsage403 | GetUsage422
}
