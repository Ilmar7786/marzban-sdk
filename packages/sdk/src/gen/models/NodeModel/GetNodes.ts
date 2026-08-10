import type { Forbidden } from '../Forbidden.ts'
import type { NodeResponse } from '../NodeResponse.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * Response Get Nodes Api Nodes Get
 * @description Successful Response
 */
export type GetNodes200 = NodeResponse[]

/**
 * Unauthorized
 * @description Unauthorized
 */
export type GetNodes401 = Unauthorized

/**
 * Forbidden
 * @description Forbidden
 */
export type GetNodes403 = Forbidden

export type GetNodesQueryResponse = GetNodes200

export type GetNodesQuery = {
  Response: GetNodes200
  Errors: GetNodes401 | GetNodes403
}
