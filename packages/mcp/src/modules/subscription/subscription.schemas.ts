import { z } from 'zod'

import {
  confirmTokenSchema,
  mcpSubscriptionUserResponseSchema,
  mcpUserResponseSchema,
  usernameSchema,
} from '@/shared/schemas'

export const subscriptionInfoInputSchema = z.object({
  subscriptionToken: z
    .string()
    .min(1)
    .describe(
      'The opaque token from a user\'s subscription URL (the path segment after "/sub/") — not an admin/session token.'
    ),
})

export const subscriptionInfoOutputSchema = mcpSubscriptionUserResponseSchema

export const usersRevokeSubscriptionInputSchema = z.object({
  username: usernameSchema,
  confirmToken: confirmTokenSchema,
})

export const usersRevokeSubscriptionOutputSchema = mcpUserResponseSchema
