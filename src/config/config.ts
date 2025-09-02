import { z } from 'zod/v4'

import { PluginContext } from '../core/plugin'

/* ---------------- Logger ---------------- */

const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error'])

const loggerOptionsSchema = z.object({
  level: logLevelSchema.optional(),
  timestamp: z.boolean().optional(),
})

const loggerMethodSchema = z.custom<(message: string, context?: string) => void>(v => typeof v === 'function')

const loggerErrorMethodSchema = z.custom<(message: string, trace?: unknown, context?: string) => void>(
  v => typeof v === 'function'
)

const loggerObjectSchema = z.object({
  debug: loggerMethodSchema,
  info: loggerMethodSchema,
  warn: loggerMethodSchema,
  error: loggerErrorMethodSchema,
})

const loggerConfigSchema = z.union([z.literal(false), loggerOptionsSchema, loggerObjectSchema])

/* ---------------- Plugins ---------------- */

const pluginHooksSchema = z
  .object({
    onInit: z.custom<(ctx: PluginContext) => void | Promise<void>>().optional(),
    onReady: z.custom<(ctx: PluginContext) => void | Promise<void>>().optional(),
  })
  .optional()

const pluginSchema = z
  .object({
    name: z.string().min(1),
    priority: z.number().optional(),
    enable: z.custom<(ctx: PluginContext) => void | Promise<void>>().optional(),
    disable: z.custom<(ctx: PluginContext) => void | Promise<void>>().optional(),
    hooks: pluginHooksSchema,
  })
  .passthrough()

/* ---------------- Webhook ---------------- */

const webhookSchema = z.object({
  secret: z.string().optional(),
})

/* ---------------- Main Config ---------------- */

export const configSchema = z.object({
  baseUrl: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  timeout: z.number().int().positive().optional().default(0),
  retries: z.number().int().nonnegative().optional().default(3),
  token: z.string().optional(),
  authenticateOnInit: z.boolean().optional().default(true),
  logger: loggerConfigSchema.optional(),
  plugins: z.array(pluginSchema).optional(),
  webhook: webhookSchema.optional(),
})

export type Config = z.infer<typeof configSchema>
