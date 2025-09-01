import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { SubscriptionUserResponse } from '../models/SubscriptionUserResponse.ts'
import { nextPlanModelSchema } from './nextPlanModelSchema.ts'
import { userDataLimitResetStrategySchema } from './userDataLimitResetStrategySchema.ts'
import { userStatusSchema } from './userStatusSchema.ts'

export const subscriptionUserResponseSchema = z.object({
  proxies: z.object({}),
  expire: z.union([z.int(), z.null()]).nullable().nullish(),
  data_limit: z.union([z.int(), z.null()]).describe('data_limit can be 0 or greater').optional(),
  get data_limit_reset_strategy() {
    return userDataLimitResetStrategySchema.optional()
  },
  sub_updated_at: z
    .union([z.iso.datetime({ local: true }), z.null()])
    .nullable()
    .nullish(),
  sub_last_user_agent: z.union([z.string(), z.null()]).nullable().nullish(),
  online_at: z
    .union([z.iso.datetime({ local: true }), z.null()])
    .nullable()
    .nullish(),
  on_hold_expire_duration: z.union([z.int(), z.null()]).nullable().nullish(),
  on_hold_timeout: z
    .union([z.iso.datetime({ local: true }), z.null()])
    .nullable()
    .nullish(),
  get next_plan() {
    return z.union([nextPlanModelSchema, z.null()]).nullable().nullish()
  },
  username: z.string(),
  get status() {
    return userStatusSchema
  },
  used_traffic: z.int(),
  lifetime_used_traffic: z.int().default(0),
  created_at: z.iso.datetime({ local: true }),
  links: z.array(z.string()).optional(),
  subscription_url: z.string().default(''),
}) as unknown as ToZod<SubscriptionUserResponse>
