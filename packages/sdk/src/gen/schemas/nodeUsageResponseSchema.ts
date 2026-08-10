import { z } from 'zod/v4'

import type { NodeUsageResponse } from '../models/NodeUsageResponse.ts'

export const nodeUsageResponseSchema = z.object({
  node_id: z.optional(z.union([z.int(), z.null()])),
  node_name: z.string(),
  uplink: z.int(),
  downlink: z.int(),
}) as unknown as z.ZodType<NodeUsageResponse>
