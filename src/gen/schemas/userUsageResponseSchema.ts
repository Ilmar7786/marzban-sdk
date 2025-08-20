import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { UserUsageResponse } from '../models/UserUsageResponse.ts'

export const userUsageResponseSchema = z.object({
  node_id: z.union([z.int(), z.null()]).optional(),
  node_name: z.string(),
  used_traffic: z.int(),
}) as unknown as ToZod<UserUsageResponse>

export type UserUsageResponseSchema = UserUsageResponse
