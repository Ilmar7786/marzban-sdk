import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { CoreStats } from '../models/CoreStats.ts'

export const coreStatsSchema = z.object({
  version: z.string(),
  started: z.boolean(),
  logs_websocket: z.string(),
}) as unknown as ToZod<CoreStats>

export type CoreStatsSchema = CoreStats
