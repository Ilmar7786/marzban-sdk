import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { AdminModify } from '../models/AdminModify.ts'

export const adminModifySchema = z.object({
  password: z.union([z.string(), z.null()]).optional(),
  is_sudo: z.boolean(),
  telegram_id: z.union([z.int(), z.null()]).optional(),
  discord_webhook: z.union([z.string(), z.null()]).optional(),
}) as unknown as ToZod<AdminModify>

export type AdminModifySchema = AdminModify
