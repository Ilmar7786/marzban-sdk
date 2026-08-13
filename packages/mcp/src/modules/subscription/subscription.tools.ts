import { defineTool } from '@/core/tool'

import {
  subscriptionInfoInputSchema,
  subscriptionInfoOutputSchema,
  usersRevokeSubscriptionInputSchema,
  usersRevokeSubscriptionOutputSchema,
} from './subscription.schemas'
import { subscriptionInfoView, usersRevokeSubscriptionView } from './subscription.views'

export const subscriptionInfoTool = defineTool({
  name: 'marzban_subscription_info',
  title: 'Get subscription info',
  description:
    'Reads subscription status/usage/expiry using the token from a subscription URL (the same public, unauthenticated endpoint client apps use) — for diagnosing a broken subscription link without needing the username. For an admin-side lookup by username, use marzban_users_get instead.',
  inputSchema: subscriptionInfoInputSchema,
  outputSchema: subscriptionInfoOutputSchema,
  scope: 'read',
  view: subscriptionInfoView,
  handler: async (args, ctx) => ctx.sdk.subscription.userSubscriptionInfo(args.subscriptionToken),
})

export const usersRevokeSubscriptionTool = defineTool({
  name: 'marzban_users_revoke_subscription',
  title: 'Revoke subscription link',
  description:
    'Issues a new subscription link for a user and invalidates the old one. Use when a link has leaked or needs rotating — not for routine renewals (use marzban_users_extend for those). Requires confirmation.',
  inputSchema: usersRevokeSubscriptionInputSchema,
  outputSchema: usersRevokeSubscriptionOutputSchema,
  scope: 'destructive',
  view: usersRevokeSubscriptionView,
  describeConsequences: args =>
    `This will revoke user "${args.username}"'s current subscription link and issue a new one. Any device or app still using the old link will stop receiving config updates until it's given the new link. This cannot be undone.`,
  handler: async (args, ctx) => ctx.sdk.user.revokeUserSubscription(args.username),
})
