import type { CoreStats } from '../CoreStats.ts'
import type { Unauthorized } from '../Unauthorized.ts'

/**
 * @description Successful Response
 */
export type GetCoreStats200 = CoreStats

/**
 * @description Unauthorized
 */
export type GetCoreStats401 = Unauthorized

export type GetCoreStatsQueryResponse = GetCoreStats200

export type GetCoreStatsQuery = {
  Response: GetCoreStats200
  Errors: GetCoreStats401
}
