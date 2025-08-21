import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { NodeUsageResponse } from '../models/NodeUsageResponse.ts'

export const nodeUsageResponseSchema = z.object({
  node_id: z.union([z.int(), z.null()]).optional(),
  node_name: z.string(),
  uplink: z.int(),
  downlink: z.int(),
}) as unknown as ToZod<NodeUsageResponse>
