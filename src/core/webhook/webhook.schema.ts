import { z } from 'zod/v4'

import { adminSchema, userResponseSchema } from '../../gen/schemas'

export const ACTIONS = {
  user_created: 'user_created',
  user_updated: 'user_updated',
  user_deleted: 'user_deleted',
  user_limited: 'user_limited',
  user_expired: 'user_expired',
  user_enabled: 'user_enabled',
  user_disabled: 'user_disabled',
  data_usage_reset: 'data_usage_reset',
  data_reset_by_next: 'data_reset_by_next',
  subscription_revoked: 'subscription_revoked',
  reached_usage_percent: 'reached_usage_percent',
  reached_days_left: 'reached_days_left',
} as const

export type WebhookAction = keyof typeof ACTIONS

export const WebhookActionSchema = z.enum(ACTIONS)

const actionLiteral = <T extends WebhookAction>(a: T) => z.literal(a)

export const BaseWebhookSchema = z.object({
  enqueued_at: z.number().default(() => Date.now() / 1000),
  send_at: z.number().default(() => Date.now() / 1000),
  tries: z.number().default(0),
})

export const UserWebhookSchema = BaseWebhookSchema.extend({
  username: z.string(),
})

export const ReachedUsagePercentSchema = UserWebhookSchema.extend({
  action: actionLiteral('reached_usage_percent'),
  user: userResponseSchema,
  used_percent: z.number(),
})

export const ReachedDaysLeftSchema = UserWebhookSchema.extend({
  action: actionLiteral('reached_days_left'),
  user: userResponseSchema,
  days_left: z.number(),
})

export const UserCreatedSchema = UserWebhookSchema.extend({
  action: actionLiteral('user_created'),
  by: adminSchema,
  user: userResponseSchema,
})

export const UserUpdatedSchema = UserWebhookSchema.extend({
  action: actionLiteral('user_updated'),
  by: adminSchema,
  user: userResponseSchema,
})

export const UserDeletedSchema = UserWebhookSchema.extend({
  action: actionLiteral('user_deleted'),
  by: adminSchema,
})

export const UserLimitedSchema = UserWebhookSchema.extend({
  action: actionLiteral('user_limited'),
  user: userResponseSchema,
})

export const UserExpiredSchema = UserWebhookSchema.extend({
  action: actionLiteral('user_expired'),
  user: userResponseSchema,
})

export const UserEnabledSchema = UserWebhookSchema.extend({
  action: actionLiteral('user_enabled'),
  by: adminSchema.nullish(),
  user: userResponseSchema,
})

export const UserDisabledSchema = UserWebhookSchema.extend({
  action: actionLiteral('user_disabled'),
  by: adminSchema,
  user: userResponseSchema,
  reason: z.string().nullish(),
})

export const UserDataUsageResetSchema = UserWebhookSchema.extend({
  action: actionLiteral('data_usage_reset'),
  by: adminSchema,
  user: userResponseSchema,
})

export const UserDataResetByNextSchema = UserWebhookSchema.extend({
  action: actionLiteral('data_reset_by_next'),
  user: userResponseSchema,
})

export const UserSubscriptionRevokedSchema = UserWebhookSchema.extend({
  action: actionLiteral('subscription_revoked'),
  by: adminSchema,
  user: userResponseSchema,
})

export const WebhookSchema = z.discriminatedUnion('action', [
  UserCreatedSchema,
  UserUpdatedSchema,
  UserDeletedSchema,
  UserLimitedSchema,
  UserExpiredSchema,
  UserEnabledSchema,
  UserDisabledSchema,
  UserDataUsageResetSchema,
  UserDataResetByNextSchema,
  UserSubscriptionRevokedSchema,
  ReachedUsagePercentSchema,
  ReachedDaysLeftSchema,
])

export type WebhookType = z.infer<typeof WebhookSchema>

export const WebhookArraySchema = z.array(WebhookSchema)

export type WebhookArrayType = z.infer<typeof WebhookArraySchema>
