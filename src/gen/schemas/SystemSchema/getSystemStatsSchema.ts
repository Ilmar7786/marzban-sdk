import { z } from 'zod/v4'

import type {
  GetSystemStats200,
  GetSystemStats401,
  GetSystemStatsQueryResponse,
} from '../../models/SystemModel/GetSystemStats.ts'
import { systemStatsSchema } from '../systemStatsSchema.ts'
import { unauthorizedSchema } from '../unauthorizedSchema.ts'

/**
 * @description Successful Response
 */
export const getSystemStats200Schema = z.lazy(() => systemStatsSchema) as unknown as z.ZodType<GetSystemStats200>

/**
 * @description Unauthorized
 */
export const getSystemStats401Schema = z.lazy(() => unauthorizedSchema) as unknown as z.ZodType<GetSystemStats401>

export const getSystemStatsQueryResponseSchema = z.lazy(
  () => getSystemStats200Schema
) as unknown as z.ZodType<GetSystemStatsQueryResponse>
