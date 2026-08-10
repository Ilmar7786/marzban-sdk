import { z } from 'zod/v4'

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
export const getCoreStats200Schema = z.lazy(() => coreStatsSchema) as unknown as z.ZodType<GetCoreStats200>

/**
 * @description Unauthorized
 */
export const getCoreStats401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetCoreStats401>

export const getCoreStatsQueryResponseSchema = z.lazy(
  () => getCoreStats200Schema
) as unknown as z.ZodType<GetCoreStatsQueryResponse>
