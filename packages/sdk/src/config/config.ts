import { z } from 'zod/v4'

import { HttpAgentLike } from '@/common'
import { reconnectOptionSchema } from '@/core/ws/utils/reconnect-policy'

import { loggerConfigSchema } from './config.logger'
import { webhookSchema } from './config.webhook'
import { DEFAULT_RETRIES, DEFAULT_TIMEOUT } from './defaults'

// Mirrors HttpAgentLike: requiring a `destroy` function (present on every
// real http.Agent/https.Agent-derived instance, inherited from Node's Agent
// base class) is what actually catches the most common mistake — passing the
// options object meant for `new https.Agent(options)` instead of the agent
// itself. A plain `typeof value === 'object'` check would let that through.
const httpAgentSchema = z.custom<HttpAgentLike>(value => typeof (value as HttpAgentLike)?.destroy === 'function', {
  message: 'Expected an http.Agent-like instance (e.g. `new https.Agent(...)`), not a plain options object.',
})

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
  httpAgent: httpAgentSchema.optional(),
  httpsAgent: httpAgentSchema.optional(),
  reconnect: reconnectOptionSchema.optional(),
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
 * @property {HttpAgentLike} [httpAgent] - Node.js `http.Agent` (or compatible) used for `http:` requests. Ignored in browsers.
 * @property {HttpAgentLike} [httpsAgent] - Node.js `https.Agent` (or compatible) used for `https:` requests and the WebSocket log stream — e.g. `new https.Agent({ ca: readFileSync('ca.pem') })` to trust a self-signed panel certificate. Ignored in browsers.
 * @property {boolean | object} [reconnect] - SDK-wide default WS reconnect policy — `LogOptions.reconnect` overrides it per call. `false` disables reconnecting entirely; an options object sets `initial`/`maxElapsedMs`/`stableAfterMs`/`minDelayMs`/`maxDelayMs`/`shouldReconnect`.
 */
export type Config = z.input<typeof configSchema>
export type ValidatedConfig = z.infer<typeof configSchema>
