import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { Admin } from '../models/Admin.ts'

export const adminSchema = z.object({
  username: z.string(),
  is_sudo: z.boolean(),
  telegram_id: z.union([z.int(), z.null()]).optional(),
  discord_webhook: z.union([z.string(), z.null()]).optional(),
  users_usage: z.union([z.int(), z.null()]).optional(),
}) as unknown as ToZod<Admin>
