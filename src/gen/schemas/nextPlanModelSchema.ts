import { z } from 'zod/v4'

import type { NextPlanModel } from '../models/NextPlanModel.ts'

export const nextPlanModelSchema = z.object({
  data_limit: z.optional(z.union([z.int(), z.null()])),
  expire: z.optional(z.union([z.int(), z.null()])),
  add_remaining_traffic: z.optional(z.boolean().default(false)),
  fire_on_either: z.optional(z.boolean().default(true)),
}) as unknown as z.ZodType<NextPlanModel>
