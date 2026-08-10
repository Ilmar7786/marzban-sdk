import { z } from 'zod/v4'

import type { NodeCreate } from '../models/NodeCreate.ts'

export const nodeCreateSchema = z.object({
  name: z.string(),
  address: z.string(),
  port: z.optional(z.int().default(62050)),
  api_port: z.optional(z.int().default(62051)),
  usage_coefficient: z.optional(z.number().gt(0).default(1)),
  add_as_new_host: z.optional(z.boolean().default(true)),
}) as unknown as z.ZodType<NodeCreate>
