import { z } from 'zod/v4'

import type { AdminModify } from '../models/AdminModify.ts'

export const adminModifySchema = z.object({
  password: z.optional(z.union([z.string(), z.null()])),
  is_sudo: z.boolean(),
  telegram_id: z.optional(z.union([z.int(), z.null()])),
  discord_webhook: z.optional(z.union([z.string(), z.null()])),
}) as unknown as z.ZodType<AdminModify>
