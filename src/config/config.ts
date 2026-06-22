import { z } from 'zod/v4'

import { loggerConfigSchema } from './config.logger'
import { webhookSchema } from './config.webhook'

export const configSchema = z.object({
  baseUrl: z.url(),
  username: z.string(),
  password: z.string(),
  timeout: z.number().int().nonnegative().default(0).optional(),
  retries: z.number().int().nonnegative().default(3).optional(),
  token: z.string().optional(),
  authenticateOnInit: z.boolean().default(true).optional(),
  logger: loggerConfigSchema.optional(),
  webhook: webhookSchema.optional(),
})

/**
 * Configuration options for initializing the MarzbanSDK client.
 *
 * @property {string} baseUrl - Base URL of the Marzban API instance. Example: 'https://api.example.com'.
 * @property {string} username - Username for authentication.
 * @property {string} password - Password for authentication.
 * @property {string} [token] - Optional JWT token for authorization. If provided, SDK will use it instead of logging in.
 * @property {number} [retries=3] - Number of automatic retries for failed HTTP requests.
 * @property {boolean} [authenticateOnInit=true] - If false, SDK will not authenticate on instantiation (call `authorize()` manually).
 */
export type Config = z.infer<typeof configSchema>
