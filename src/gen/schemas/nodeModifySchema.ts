import { z } from 'zod/v4'

import type { NodeModify } from '../models/NodeModify.ts'
import { nodeStatusSchema } from './nodeStatusSchema.ts'

export const nodeModifySchema = z.object({
  name: z.union([z.string(), z.null()]).nullish(),
  address: z.union([z.string(), z.null()]).nullish(),
  port: z.union([z.int(), z.null()]).nullish(),
  api_port: z.union([z.int(), z.null()]).nullish(),
  usage_coefficient: z.union([z.number(), z.null()]).nullish(),
  get status() {
    return z.union([nodeStatusSchema, z.null()]).nullish()
  },
}) as unknown as z.ZodType<NodeModify>
