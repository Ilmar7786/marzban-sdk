import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type GetAdminUsagePathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * Response Get Admin Usage Api Admin Usage  Username  Get
 * @description Successful Response
 */
export type GetAdminUsage200 = number

/**
 * Unauthorized
 * @description Unauthorized
 */
export type GetAdminUsage401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type GetAdminUsage403 = Forbidden

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type GetAdminUsage422 = HTTPValidationError

export type GetAdminUsageQueryResponse = GetAdminUsage200

export type GetAdminUsageQuery = {
  Response: GetAdminUsage200
  PathParams: GetAdminUsagePathParams
  Errors: GetAdminUsage401 | GetAdminUsage403 | GetAdminUsage422
}
