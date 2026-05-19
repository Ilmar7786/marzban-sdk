import { z } from 'zod/v4'

import type { UserCreate } from '../models/UserCreate.ts'
import { nextPlanModelSchema } from './nextPlanModelSchema.ts'
import { proxySettingsSchema } from './proxySettingsSchema.ts'
import { userDataLimitResetStrategySchema } from './userDataLimitResetStrategySchema.ts'
import { userStatusCreateSchema } from './userStatusCreateSchema.ts'

export const userCreateSchema = z.object({
  proxies: z.optional(
    z
      .object({})
      .catchall(z.lazy(() => proxySettingsSchema))
      .default({})
  ),
  expire: z.union([z.int(), z.null()]).nullish(),
  data_limit: z.optional(z.union([z.int(), z.null()]).describe('data_limit can be 0 or greater')),
  get data_limit_reset_strategy() {
    return userDataLimitResetStrategySchema.optional()
  },
  inbounds: z.optional(z.object({}).catchall(z.array(z.string())).default({})),
  note: z.union([z.string(), z.null()]).nullish(),
  sub_updated_at: z.union([z.iso.datetime({ local: true }), z.null()]).nullish(),
  sub_last_user_agent: z.union([z.string(), z.null()]).nullish(),
  online_at: z.union([z.iso.datetime({ local: true }), z.null()]).nullish(),
  on_hold_expire_duration: z.union([z.int(), z.null()]).nullish(),
  on_hold_timeout: z.union([z.iso.datetime({ local: true }), z.null()]).nullish(),
  auto_delete_in_days: z.union([z.int(), z.null()]).nullish(),
  get next_plan() {
    return z.union([nextPlanModelSchema, z.null()]).nullish()
  },
  username: z.string(),
  get status() {
    return userStatusCreateSchema.optional()
  },
}) as unknown as z.ZodType<UserCreate>
