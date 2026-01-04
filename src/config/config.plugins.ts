import z from 'zod/v4'

import { PluginContext } from '@/core/plugin'

const pluginHooksSchema = z
  .object({
    onInit: z.custom<(ctx: PluginContext) => void | Promise<void>>().optional(),
    onReady: z.custom<(ctx: PluginContext) => void | Promise<void>>().optional(),
  })
  .optional()

export const pluginSchema = z
  .object({
    name: z.string().min(1),
    priority: z.number().optional(),
    enable: z.custom<(ctx: PluginContext) => void | Promise<void>>().optional(),
    disable: z.custom<(ctx: PluginContext) => void | Promise<void>>().optional(),
    hooks: pluginHooksSchema,
  })
  .passthrough()
