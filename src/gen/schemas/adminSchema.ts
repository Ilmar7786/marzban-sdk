import { z } from 'zod/v4'

import type { Admin } from '../models/Admin.ts'

export const adminSchema = z.object({
  username: z.string(),
  is_sudo: z.boolean(),
  telegram_id: z.optional(z.union([z.int(), z.null()])),
  discord_webhook: z.optional(z.union([z.string(), z.null()])),
  users_usage: z.optional(z.union([z.int(), z.null()])),
}) as unknown as z.ZodType<Admin>
