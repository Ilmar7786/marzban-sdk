import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { NodeModify } from '../models/NodeModify.ts'
import { nodeStatusSchema } from './nodeStatusSchema.ts'

export const nodeModifySchema = z.object({
  name: z.union([z.string(), z.null()]).nullable().nullish(),
  address: z.union([z.string(), z.null()]).nullable().nullish(),
  port: z.union([z.int(), z.null()]).nullable().nullish(),
  api_port: z.union([z.int(), z.null()]).nullable().nullish(),
  usage_coefficient: z.union([z.number(), z.null()]).nullable().nullish(),
  get status() {
    return z.union([nodeStatusSchema, z.null()]).nullable().nullish()
  },
}) as unknown as ToZod<NodeModify>
