import { z } from 'zod/v4'

import { loggerConfigSchema } from './config.logger'
import { webhookSchema } from './config.webhook'
import { DEFAULT_RETRIES, DEFAULT_TIMEOUT } from './defaults'

export const configSchema = z.object({
  baseUrl: z.url(),
  username: z.string().min(1),
  password: z.string().min(1),
  timeout: z.number().int().nonnegative().default(DEFAULT_TIMEOUT),
  retries: z.number().int().nonnegative().default(DEFAULT_RETRIES),
  token: z.string().optional(),
  authenticateOnInit: z.boolean().default(true),
  logger: loggerConfigSchema.optional(),
  webhook: webhookSchema.optional(),
})

/**
 * Configuration options supplied by SDK consumers.
 *
 * Fields with defaults may be omitted by callers; they are filled during validation.
 *
 * @property {string} baseUrl - Base URL of the Marzban API instance. Example: 'https://api.example.com'.
 * @property {string} username - Username for authentication (non-empty).
 * @property {string} password - Password for authentication (non-empty).
 * @property {number} [timeout=30000] - Request timeout in milliseconds. `0` disables the timeout (wait forever).
 * @property {number} [retries=3] - Number of automatic retries for failed HTTP requests and WS reconnections.
 * @property {string} [token] - Optional JWT token for authorization. If provided, SDK will use it instead of logging in.
 * @property {boolean} [authenticateOnInit=true] - If false, SDK will not authenticate on instantiation (call `authorize()` manually).
 * @property {false | LoggerOptions | Logger} [logger] - Logging configuration: `false` to disable, options for the built-in logger, or a custom logger.
 * @property {object} [webhook] - Webhook handling options (e.g. signature `secret`).
 */
export type Config = z.input<typeof configSchema>
export type ValidatedConfig = z.infer<typeof configSchema>
