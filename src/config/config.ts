import { z } from 'zod'

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

export const configSchema = z.object({
  baseUrl: z.url(),
  username: z.string().min(1),
  password: z.string().min(1),
  timeout: z.number().int().positive().optional().default(0),
  retries: z.number().int().nonnegative().optional().default(3),
  token: z.string().optional(),
  authenticateOnInit: z.boolean().optional().default(true),
  logger: loggerConfigSchema.optional(),
})

export type Config = z.infer<typeof configSchema>
