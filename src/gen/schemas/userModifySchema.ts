import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { UserModify } from '../models/UserModify.ts'
import { nextPlanModelSchema } from './nextPlanModelSchema.ts'
import { proxySettingsSchema } from './proxySettingsSchema.ts'
import { userDataLimitResetStrategySchema } from './userDataLimitResetStrategySchema.ts'
import { userStatusModifySchema } from './userStatusModifySchema.ts'

export const userModifySchema = z.object({
  proxies: z.object({}).catchall(proxySettingsSchema).default({}),
  expire: z.union([z.int(), z.null()]).nullable().nullish(),
  data_limit: z.union([z.int(), z.null()]).describe('data_limit can be 0 or greater').optional(),
  get data_limit_reset_strategy() {
    return userDataLimitResetStrategySchema.optional()
  },
  inbounds: z.object({}).catchall(z.array(z.string())).default({}),
  note: z.union([z.string(), z.null()]).nullable().nullish(),
  sub_updated_at: z
    .union([z.iso.datetime({ offset: true }), z.null()])
    .nullable()
    .nullish(),
  sub_last_user_agent: z.union([z.string(), z.null()]).nullable().nullish(),
  online_at: z
    .union([z.iso.datetime({ offset: true }), z.null()])
    .nullable()
    .nullish(),
  on_hold_expire_duration: z.union([z.int(), z.null()]).nullable().nullish(),
  on_hold_timeout: z
    .union([z.iso.datetime({ offset: true }), z.null()])
    .nullable()
    .nullish(),
  auto_delete_in_days: z.union([z.int(), z.null()]).nullable().nullish(),
  get next_plan() {
    return z.union([nextPlanModelSchema, z.null()]).nullable().nullish()
  },
  get status() {
    return userStatusModifySchema.optional()
  },
}) as unknown as ToZod<UserModify>
