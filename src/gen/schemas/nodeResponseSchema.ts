import { z } from 'zod/v4'

import type { NodeResponse } from '../models/NodeResponse.ts'
import { nodeStatusSchema } from './nodeStatusSchema.ts'

export const nodeResponseSchema = z.object({
  name: z.string(),
  address: z.string(),
  port: z.optional(z.int().default(62050)),
  api_port: z.optional(z.int().default(62051)),
  usage_coefficient: z.optional(z.number().gt(0).default(1)),
  id: z.int(),
  xray_version: z.optional(z.union([z.string(), z.null()])),
  get status() {
    return nodeStatusSchema
  },
  message: z.optional(z.union([z.string(), z.null()])),
}) as unknown as z.ZodType<NodeResponse>
