import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { NextPlanModel } from '../models/NextPlanModel.ts'

export const nextPlanModelSchema = z.object({
  data_limit: z.union([z.int(), z.null()]).optional(),
  expire: z.union([z.int(), z.null()]).optional(),
  add_remaining_traffic: z.boolean().default(false),
  fire_on_either: z.boolean().default(true),
}) as unknown as ToZod<NextPlanModel>

export type NextPlanModelSchema = NextPlanModel
