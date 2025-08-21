import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { NodeSettings } from '../models/NodeSettings.ts'

export const nodeSettingsSchema = z.object({
  min_node_version: z.string().default('v0.2.0'),
  certificate: z.string(),
}) as unknown as ToZod<NodeSettings>
