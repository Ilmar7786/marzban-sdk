import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { AdminCreate } from '../models/AdminCreate.ts'

export const adminCreateSchema = z.object({
  username: z.string(),
  is_sudo: z.boolean(),
  telegram_id: z.union([z.int(), z.null()]).optional(),
  discord_webhook: z.union([z.string(), z.null()]).optional(),
  users_usage: z.union([z.int(), z.null()]).optional(),
  password: z.string(),
}) as unknown as ToZod<AdminCreate>

export type AdminCreateSchema = AdminCreate
