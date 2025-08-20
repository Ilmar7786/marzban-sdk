import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { NodeCreate } from '../models/NodeCreate.ts'

export const nodeCreateSchema = z.object({
  name: z.string(),
  address: z.string(),
  port: z.int().default(62050),
  api_port: z.int().default(62051),
  usage_coefficient: z.number().default(1),
  add_as_new_host: z.boolean().default(true),
}) as unknown as ToZod<NodeCreate>

export type NodeCreateSchema = NodeCreate
