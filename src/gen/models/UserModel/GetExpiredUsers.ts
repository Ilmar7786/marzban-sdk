import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type GetExpiredUsersQueryParams = {
  expired_after?: string | null
  expired_before?: string | null
}

/**
 * @description Successful Response
 */
export type GetExpiredUsers200 = string[]

/**
 * @description Unauthorized
 */
export type GetExpiredUsers401 = Unauthorized

/**
 * @description Validation Error
 */
export type GetExpiredUsers422 = HTTPValidationError

export type GetExpiredUsersQueryResponse = GetExpiredUsers200

export type GetExpiredUsersQuery = {
  Response: GetExpiredUsers200
  QueryParams: GetExpiredUsersQueryParams
  Errors: GetExpiredUsers401 | GetExpiredUsers422
}
