import type { ToZod } from '@kubb/plugin-zod/utils/v4'

import type {
  GetCoreStats200,
  GetCoreStats401,
  GetCoreStatsQueryResponse,
} from '../../models/CoreModel/GetCoreStats.ts'
import { coreStatsSchema } from '../coreStatsSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getCoreStats200Schema = coreStatsSchema as unknown as ToZod<GetCoreStats200>

export type GetCoreStats200Schema = GetCoreStats200

/**
 * @description Unauthorized
 */
export const getCoreStats401Schema = unauthorizedSchema as unknown as ToZod<GetCoreStats401>

export type GetCoreStats401Schema = GetCoreStats401

export const getCoreStatsQueryResponseSchema = getCoreStats200Schema as unknown as ToZod<GetCoreStatsQueryResponse>

export type GetCoreStatsQueryResponseSchema = GetCoreStatsQueryResponse
