import z from 'zod/v4'

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

export const loggerConfigSchema = z.union([z.literal(false), loggerOptionsSchema, loggerObjectSchema])
