import type { HTTPValidationError } from '../HTTPValidationError.ts'

export type UserGetUsagePathParams = {
  /**
   * @type string
   */
  token: string
}

export type UserGetUsageQueryParams = {
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
export type UserGetUsage200 = any

/**
 * @description Validation Error
 */
export type UserGetUsage422 = HTTPValidationError

export type UserGetUsageQueryResponse = UserGetUsage200

export type UserGetUsageQuery = {
  Response: UserGetUsage200
  PathParams: UserGetUsagePathParams
  QueryParams: UserGetUsageQueryParams
  Errors: UserGetUsage422
}
