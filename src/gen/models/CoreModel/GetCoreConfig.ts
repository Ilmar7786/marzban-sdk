import type { Forbidden } from '../Forbidden.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type GetCoreConfig200 = object

/**
 * @description Unauthorized
 */
export type GetCoreConfig401 = Unauthorized

/**
 * @description Forbidden
 */
export type GetCoreConfig403 = Forbidden

export type GetCoreConfigQueryResponse = GetCoreConfig200

export type GetCoreConfigQuery = {
  Response: GetCoreConfig200
  Errors: GetCoreConfig401 | GetCoreConfig403
}
