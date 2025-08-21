import type { ToZod } from '@kubb/plugin-zod/utils/v4'

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
export const getSystemStats200Schema = systemStatsSchema as unknown as ToZod<GetSystemStats200>

/**
 * @description Unauthorized
 */
export const getSystemStats401Schema = unauthorizedSchema as unknown as ToZod<GetSystemStats401>

export const getSystemStatsQueryResponseSchema =
  getSystemStats200Schema as unknown as ToZod<GetSystemStatsQueryResponse>
