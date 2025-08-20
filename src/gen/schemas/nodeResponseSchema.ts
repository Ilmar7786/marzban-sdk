import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { NodeResponse } from '../models/NodeResponse.ts'
import { nodeStatusSchema } from './nodeStatusSchema.ts'

export const nodeResponseSchema = z.object({
  name: z.string(),
  address: z.string(),
  port: z.int().default(62050),
  api_port: z.int().default(62051),
  usage_coefficient: z.number().default(1),
  id: z.int(),
  xray_version: z.union([z.string(), z.null()]).optional(),
  get status() {
    return nodeStatusSchema
  },
  message: z.union([z.string(), z.null()]).optional(),
}) as unknown as ToZod<NodeResponse>

export type NodeResponseSchema = NodeResponse
