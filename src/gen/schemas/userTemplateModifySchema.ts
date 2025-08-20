import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { UserTemplateModify } from '../models/UserTemplateModify.ts'

export const userTemplateModifySchema = z.object({
  name: z.union([z.string(), z.null()]).nullable().nullish(),
  data_limit: z.union([z.int(), z.null()]).describe('data_limit can be 0 or greater').optional(),
  expire_duration: z.union([z.int(), z.null()]).describe('expire_duration can be 0 or greater in seconds').optional(),
  username_prefix: z.union([z.string(), z.null()]).optional(),
  username_suffix: z.union([z.string(), z.null()]).optional(),
  inbounds: z.object({}).catchall(z.array(z.string())).default({}),
}) as unknown as ToZod<UserTemplateModify>

export type UserTemplateModifySchema = UserTemplateModify
