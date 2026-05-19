import { z } from 'zod/v4'

import type { UserUsageResponse } from '../models/UserUsageResponse.ts'

export const userUsageResponseSchema = z.object({
  node_id: z.optional(z.union([z.int(), z.null()])),
  node_name: z.string(),
  used_traffic: z.int(),
}) as unknown as z.ZodType<UserUsageResponse>
