import { z } from 'zod/v4'

import { loggerConfigSchema } from './config.logger'
import { webhookSchema } from './config.webhook'

export const configSchema = z.object({
  baseUrl: z.url(),
  username: z.string(),
  password: z.string(),
  timeout: z.number().int().positive().default(0).optional(),
  retries: z.number().int().nonnegative().default(3).optional(),
  token: z.string().optional(),
  authenticateOnInit: z.boolean().default(true).optional(),
  logger: loggerConfigSchema.optional(),
  webhook: webhookSchema.optional(),
})

export type Config = z.infer<typeof configSchema>
