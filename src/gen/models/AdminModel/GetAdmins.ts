import type { Admin } from '../Admin.ts'
import type { Forbidden } from '../Forbidden.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type GetAdminsQueryParams = {
  offset?: number | null
  limit?: number | null
  username?: string | null
}

/**
 * @description Successful Response
 */
export type GetAdmins200 = Admin[]

/**
 * @description Unauthorized
 */
export type GetAdmins401 = Unauthorized

/**
 * @description Forbidden
 */
export type GetAdmins403 = Forbidden

/**
 * @description Validation Error
 */
export type GetAdmins422 = HTTPValidationError

export type GetAdminsQueryResponse = GetAdmins200

export type GetAdminsQuery = {
  Response: GetAdmins200
  QueryParams: GetAdminsQueryParams
  Errors: GetAdmins401 | GetAdmins403 | GetAdmins422
}
