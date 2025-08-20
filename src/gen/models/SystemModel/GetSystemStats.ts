import type { SystemStats } from '../SystemStats.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type GetSystemStats200 = SystemStats

/**
 * @description Unauthorized
 */
export type GetSystemStats401 = Unauthorized

export type GetSystemStatsQueryResponse = GetSystemStats200

export type GetSystemStatsQuery = {
  Response: GetSystemStats200
  Errors: GetSystemStats401
}
