import type { Forbidden } from '../Forbidden.ts'
import type { NotFound } from '../NotFound.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type ResetUsersDataUsage200 = any

/**
 * Unauthorized
 * @description Unauthorized
 */
export type ResetUsersDataUsage401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type ResetUsersDataUsage403 = Forbidden

/**
 * NotFound
 * @description Not found
 */
export type ResetUsersDataUsage404 = NotFound

export type ResetUsersDataUsageMutationResponse = ResetUsersDataUsage200

export type ResetUsersDataUsageMutation = {
  Response: ResetUsersDataUsage200
  Errors: ResetUsersDataUsage401 | ResetUsersDataUsage403 | ResetUsersDataUsage404
}
