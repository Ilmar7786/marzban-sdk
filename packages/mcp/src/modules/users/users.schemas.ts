import { userResponseSchema, userUsageResponseSchema } from 'marzban-sdk'
import { z } from 'zod'

import { durationMsInputSchema, sizeInputSchema, timestampInputSchema, usernameSchema } from '@/shared/schemas'

// --- shared fragments -------------------------------------------------

const proxiesInputSchema = z
  .record(z.string(), z.record(z.string(), z.unknown()))
  .optional()
  .describe(
    'Protocol name -> settings, e.g. {"vless": {"id": "<uuid>"}}. Omit to leave unchanged (update) or use server defaults (create).'
  )

const inboundsInputSchema = z
  .record(z.string(), z.array(z.string()))
  .optional()
  .describe('Protocol name -> inbound tags to restrict this user to. Omit for all inbounds.')

const dataLimitResetStrategySchema = z.enum(['no_reset', 'day', 'week', 'month', 'year'])

// --- users_list ---------------------------------------------------------

export const usersListInputSchema = z.object({
  search: z.string().min(1).optional().describe('Matches username or note (server-side substring search).'),
  status: z.enum(['active', 'disabled', 'limited', 'expired', 'on_hold']).optional(),
  limit: z.number().int().positive().optional().describe('Default 25, max 100.'),
  offset: z.number().int().nonnegative().optional(),
})

export const usersListOutputSchema = z.object({
  users: z.array(userResponseSchema),
  total: z.number(),
  note: z.string(),
})

// --- users_get -----------------------------------------------------------

export const usersGetInputSchema = z.object({
  username: usernameSchema,
})

export const userSummarySchema = z.object({
  dataLeftBytes: z.number().nullable(),
  usagePercent: z.number().nullable(),
  daysLeft: z.number().nullable(),
  isExpired: z.boolean(),
})

export const usersGetOutputSchema = z.object({
  user: userResponseSchema,
  summary: userSummarySchema,
})

// --- users_create ----------------------------------------------------------

export const usersCreateInputSchema = z.object({
  username: usernameSchema,
  status: z.enum(['active', 'on_hold']).optional().describe('Defaults to active.'),
  dataLimit: sizeInputSchema.optional().describe('e.g. "10GB". Omit or 0 for unlimited.'),
  dataLimitResetStrategy: dataLimitResetStrategySchema.optional(),
  expire: timestampInputSchema.optional().describe('e.g. "30d". Omit for no expiration.'),
  note: z.string().optional(),
  proxies: proxiesInputSchema,
  inbounds: inboundsInputSchema,
  templateId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Create from a user template instead of specifying proxies/inbounds by hand.'),
  onHoldExpireDuration: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe(
      'Seconds the user may stay on_hold before expiring, counted from their first connection. Only meaningful when status is on_hold.'
    ),
})

export const usersCreateOutputSchema = userResponseSchema

// --- users_update ----------------------------------------------------------

export const usersUpdateInputSchema = z.object({
  username: usernameSchema,
  dataLimit: sizeInputSchema.optional().describe('e.g. "10GB". 0 means unlimited.'),
  dataLimitResetStrategy: dataLimitResetStrategySchema.optional(),
  expire: timestampInputSchema.optional().describe('e.g. "30d" or an absolute date. 0 means unlimited.'),
  note: z.string().optional(),
  proxies: proxiesInputSchema,
  inbounds: inboundsInputSchema,
})

export const usersUpdateOutputSchema = userResponseSchema

// --- users_activate / deactivate / hold -------------------------------------

export const usersActivateInputSchema = z.object({ username: usernameSchema })
export const usersActivateOutputSchema = userResponseSchema

export const usersDeactivateInputSchema = z.object({ username: usernameSchema })
export const usersDeactivateOutputSchema = userResponseSchema

export const usersHoldInputSchema = z.object({
  username: usernameSchema,
  onHoldExpireDuration: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Seconds the user may stay on_hold before expiring, counted from their first connection.'),
})
export const usersHoldOutputSchema = userResponseSchema

// --- users_extend ----------------------------------------------------------

export const usersExtendInputSchema = z
  .object({
    username: usernameSchema,
    addDuration: durationMsInputSchema
      .optional()
      .describe('Relative duration to add to the current expiration, e.g. "30d".'),
    addData: sizeInputSchema
      .optional()
      .describe('Extra data allowance to add on top of the current limit, e.g. "10GB".'),
  })
  .refine(v => v.addDuration !== undefined || v.addData !== undefined, {
    message: 'Provide addDuration and/or addData — extend needs at least one of them.',
    path: ['addDuration'],
  })

export const usersExtendOutputSchema = z.object({
  user: userResponseSchema,
  note: z.string(),
})

// --- users_usage -------------------------------------------------------------

export const usersUsageInputSchema = z.object({
  username: usernameSchema,
  start: z.string().optional().describe('ISO datetime. Omit for no lower bound.'),
  end: z.string().optional().describe('ISO datetime. Omit for no upper bound.'),
})

export const usersUsageOutputSchema = z.object({
  username: z.string(),
  usedTraffic: z.number(),
  lifetimeUsedTraffic: z.number(),
  dataLimit: z.number().nullable(),
  byNode: z.array(userUsageResponseSchema),
})
