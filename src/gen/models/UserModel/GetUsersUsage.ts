import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'
import type { UsersUsagesResponse } from '../UsersUsagesResponse.ts'

export type GetUsersUsageQueryParams = {
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
  admin?: string[] | null
}

/**
 * @description Successful Response
 */
export type GetUsersUsage200 = UsersUsagesResponse

/**
 * @description Unauthorized
 */
export type GetUsersUsage401 = Unauthorized

/**
 * @description Validation Error
 */
export type GetUsersUsage422 = HTTPValidationError

export type GetUsersUsageQueryResponse = GetUsersUsage200

export type GetUsersUsageQuery = {
  Response: GetUsersUsage200
  QueryParams: GetUsersUsageQueryParams
  Errors: GetUsersUsage401 | GetUsersUsage422
}
