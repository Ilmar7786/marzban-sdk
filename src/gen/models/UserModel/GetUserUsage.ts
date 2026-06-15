import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'
import type { UserUsagesResponse } from '../UserUsagesResponse.ts'

export type GetUserUsagePathParams = {
  /**
   * @type string
   */
  username: string
}

export type GetUserUsageQueryParams = {
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
 * UserUsagesResponse
 * @description Successful Response
 */
export type GetUserUsage200 = UserUsagesResponse

/**
 * Unauthorized
 * @description Unauthorized
 */
export type GetUserUsage401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type GetUserUsage403 = Forbidden

/**
 * NotFound
 * @description Not found
 */
export type GetUserUsage404 = NotFound

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type GetUserUsage422 = HTTPValidationError

export type GetUserUsageQueryResponse = GetUserUsage200

export type GetUserUsageQuery = {
  Response: GetUserUsage200
  PathParams: GetUserUsagePathParams
  QueryParams: GetUserUsageQueryParams
  Errors: GetUserUsage401 | GetUserUsage403 | GetUserUsage404 | GetUserUsage422
}
