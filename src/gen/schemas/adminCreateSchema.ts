import { z } from 'zod/v4'

import type { AdminCreate } from '../models/AdminCreate.ts'

export const adminCreateSchema = z.object({
  username: z.string(),
  is_sudo: z.boolean(),
  telegram_id: z.optional(z.union([z.int(), z.null()])),
  discord_webhook: z.optional(z.union([z.string(), z.null()])),
  users_usage: z.optional(z.union([z.int(), z.null()])),
  password: z.string(),
}) as unknown as z.ZodType<AdminCreate>
