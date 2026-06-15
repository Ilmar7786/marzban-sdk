import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type GetExpiredUsersQueryParams = {
  expired_after?: string | null
  expired_before?: string | null
}

/**
 * Response Get Expired Users Api Users Expired Get
 * @description Successful Response
 */
export type GetExpiredUsers200 = string[]

/**
 * Unauthorized
 * @description Unauthorized
 */
export type GetExpiredUsers401 = Unauthorized

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type GetExpiredUsers422 = HTTPValidationError

export type GetExpiredUsersQueryResponse = GetExpiredUsers200

export type GetExpiredUsersQuery = {
  Response: GetExpiredUsers200
  QueryParams: GetExpiredUsersQueryParams
  Errors: GetExpiredUsers401 | GetExpiredUsers422
}
