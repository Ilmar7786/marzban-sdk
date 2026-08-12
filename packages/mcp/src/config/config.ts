import { z } from 'zod'

import {
  DEFAULT_CONFIRM,
  DEFAULT_FORMAT,
  DEFAULT_LOG_LEVEL,
  DEFAULT_MAX_CHARS,
  DEFAULT_PROFILE,
  DEFAULT_SHOW_LINKS,
  DEFAULT_VERBOSITY,
} from './defaults'

export const mcpConfigSchema = z
  .object({
    baseUrl: z.url(),
    username: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    token: z.string().min(1).optional(),
    profile: z.enum(['readonly', 'standard', 'full']).default(DEFAULT_PROFILE),
    format: z.enum(['text', 'table', 'json']).default(DEFAULT_FORMAT),
    verbosity: z.enum(['compact', 'full']).default(DEFAULT_VERBOSITY),
    confirm: z.enum(['auto', 'always', 'off']).default(DEFAULT_CONFIRM),
    maxChars: z.number().int().positive().default(DEFAULT_MAX_CHARS),
    toolsAllow: z.array(z.string().min(1)).optional(),
    toolsDeny: z.array(z.string().min(1)).optional(),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default(DEFAULT_LOG_LEVEL),
    showLinks: z.boolean().default(DEFAULT_SHOW_LINKS),
  })
  .check(ctx => {
    const { username, password, token } = ctx.value
    if (!token && !(username && password)) {
      ctx.issues.push({
        code: 'custom',
        message: 'Provide MARZBAN_USERNAME + MARZBAN_PASSWORD, or MARZBAN_TOKEN (or both).',
        input: ctx.value,
        path: ['token'],
      })
    }
    if ((username && !password) || (!username && password)) {
      ctx.issues.push({
        code: 'custom',
        message: 'MARZBAN_USERNAME and MARZBAN_PASSWORD must be provided together.',
        input: ctx.value,
        path: ['password'],
      })
    }
  })

export type McpConfig = z.infer<typeof mcpConfigSchema>
export type RawMcpConfig = z.input<typeof mcpConfigSchema>
