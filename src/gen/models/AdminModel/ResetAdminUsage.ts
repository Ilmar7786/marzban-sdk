import type { Admin } from '../Admin.ts'
import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type ResetAdminUsagePathParams = {
  /**
   * @type string
   */
  username: string
}

/**
 * Admin
 * @description Successful Response
 */
export type ResetAdminUsage200 = Admin

/**
 * Unauthorized
 * @description Unauthorized
 */
export type ResetAdminUsage401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type ResetAdminUsage403 = Forbidden

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type ResetAdminUsage422 = HTTPValidationError

export type ResetAdminUsageMutationResponse = ResetAdminUsage200

export type ResetAdminUsageMutation = {
  Response: ResetAdminUsage200
  PathParams: ResetAdminUsagePathParams
  Errors: ResetAdminUsage401 | ResetAdminUsage403 | ResetAdminUsage422
}
