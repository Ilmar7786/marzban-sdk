import type { Forbidden } from '../Forbidden.ts'
import type { HTTPException } from '../HTTPException.ts'
import type { HTTPValidationError } from '../HTTPValidationError.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'
import type { UsersResponse } from '../UsersResponse.ts'
import type { UserStatus } from '../UserStatus.ts'

export type GetUsersQueryParams = {
  /**
   * @type integer | undefined
   */
  offset?: number
  /**
   * @type integer | undefined
   */
  limit?: number
  /**
   * @type array | undefined
   */
  username?: string[]
  search?: string | null
  admin?: string[] | null
  /**
   * @type string | undefined
   */
  status?: UserStatus
  /**
   * @type string | undefined
   */
  sort?: string
}

/**
 * @description Successful Response
 */
export type GetUsers200 = UsersResponse

/**
 * @description Bad request
 */
export type GetUsers400 = HTTPException

/**
 * @description Unauthorized
 */
export type GetUsers401 = Unauthorized

/**
 * @description Forbidden
 */
export type GetUsers403 = Forbidden

/**
 * @description Not found
 */
export type GetUsers404 = NotFound

/**
 * @description Validation Error
 */
export type GetUsers422 = HTTPValidationError

export type GetUsersQueryResponse = GetUsers200

export type GetUsersQuery = {
  Response: GetUsers200
  QueryParams: GetUsersQueryParams
  Errors: GetUsers400 | GetUsers401 | GetUsers403 | GetUsers404 | GetUsers422
}
