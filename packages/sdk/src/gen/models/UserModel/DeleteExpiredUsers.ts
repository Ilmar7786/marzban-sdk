import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { Unauthorized } from '../Unauthorized.ts'

export type DeleteExpiredUsersQueryParams = {
  expired_after?: string | null
  expired_before?: string | null
}

/**
 * Response Delete Expired Users Api Users Expired Delete
 * @description Successful Response
 */
export type DeleteExpiredUsers200 = string[]

/**
 * Unauthorized
 * @description Unauthorized
 */
export type DeleteExpiredUsers401 = Unauthorized

/**
 * HTTPValidationError
 * @description Validation Error
 */
export type DeleteExpiredUsers422 = HTTPValidationError

export type DeleteExpiredUsersMutationResponse = DeleteExpiredUsers200

export type DeleteExpiredUsersMutation = {
  Response: DeleteExpiredUsers200
  QueryParams: DeleteExpiredUsersQueryParams
  Errors: DeleteExpiredUsers401 | DeleteExpiredUsers422
}
