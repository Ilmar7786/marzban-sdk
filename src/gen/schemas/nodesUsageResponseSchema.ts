import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { NodesUsageResponse } from '../models/NodesUsageResponse.ts'
import { nodeUsageResponseSchema } from './nodeUsageResponseSchema.ts'

export const nodesUsageResponseSchema = z.object({
  get usages() {
    return z.array(nodeUsageResponseSchema)
  },
}) as unknown as ToZod<NodesUsageResponse>
