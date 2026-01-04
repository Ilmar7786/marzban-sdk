import { z } from 'zod/v4'

import type { NodeStatus } from '../models/NodeStatus.ts'

export const nodeStatusSchema = z.enum([
  'connected',
  'connecting',
  'error',
  'disabled',
]) as unknown as z.ZodType<NodeStatus>
