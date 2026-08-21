import { subscriptionUserResponseSchema, userResponseSchema } from 'marzban-sdk'
import { z } from 'zod'

import { confirmTokenSchema, usernameSchema } from '@/shared/schemas'

export const subscriptionInfoInputSchema = z.object({
  subscriptionToken: z
    .string()
    .min(1)
    .describe(
      'The opaque token from a user\'s subscription URL (the path segment after "/sub/") — not an admin/session token.'
    ),
})

export const subscriptionInfoOutputSchema = subscriptionUserResponseSchema

export const usersRevokeSubscriptionInputSchema = z.object({
  username: usernameSchema,
  confirmToken: confirmTokenSchema,
})

export const usersRevokeSubscriptionOutputSchema = userResponseSchema
