import { formatBytes, type ProxySettings } from 'marzban-sdk'

import { defineTool } from '@/core/define-tool'
import { ToolError } from '@/core/errors'
import { clampLimit, paginationNote } from '@/shared/pagination'

import { buildRenewalPatch, summarizeUser } from './users.helpers'
import {
  usersActivateInputSchema,
  usersActivateOutputSchema,
  usersCreateInputSchema,
  usersCreateOutputSchema,
  usersDeactivateInputSchema,
  usersDeactivateOutputSchema,
  usersDeleteInputSchema,
  usersDeleteOutputSchema,
  usersExtendInputSchema,
  usersExtendOutputSchema,
  usersGetInputSchema,
  usersGetOutputSchema,
  usersHoldInputSchema,
  usersHoldOutputSchema,
  usersListInputSchema,
  usersListOutputSchema,
  usersResetTrafficInputSchema,
  usersResetTrafficOutputSchema,
  usersUpdateInputSchema,
  usersUpdateOutputSchema,
  usersUsageInputSchema,
  usersUsageOutputSchema,
} from './users.schemas'
import {
  userDeletedView,
  userExtendedView,
  userListView,
  usersResetTrafficView,
  userUsageView,
  userView,
  userWithSummaryView,
} from './users.views'

export const usersListTool = defineTool({
  name: 'marzban_users_list',
  title: 'List users',
  description:
    'Lists users, optionally filtered by status or a search term (matches username/note). Paginated — default 25, max 100 per call; prefer `search` over paging through everyone. For one known username, use marzban_users_get instead.',
  inputSchema: usersListInputSchema,
  outputSchema: usersListOutputSchema,
  scope: 'read',
  view: userListView,
  handler: async (args, ctx) => {
    const limit = clampLimit(args.limit)
    const offset = args.offset ?? 0
    const result = await ctx.sdk.user.getUsers({ search: args.search, status: args.status, limit, offset })
    return { users: result.users, total: result.total, note: paginationNote(result.users.length, result.total, offset) }
  },
})

export const usersGetTool = defineTool({
  name: 'marzban_users_get',
  title: 'Get user',
  description:
    'Fetches one user by username, with a computed summary: data left, days left, usage percent, and whether they are effectively expired (covers the case where status has not caught up with an already-past expire yet).',
  inputSchema: usersGetInputSchema,
  outputSchema: usersGetOutputSchema,
  scope: 'read',
  view: userWithSummaryView,
  handler: async (args, ctx) => {
    const user = await ctx.sdk.user.getUser(args.username)
    return { user, summary: summarizeUser(user) }
  },
})

export const usersCreateTool = defineTool({
  name: 'marzban_users_create',
  title: 'Create user',
  description:
    'Creates a new user. `dataLimit` accepts a human size ("10GB"), `expire` a relative duration ("30d") or absolute date — both default to unlimited when omitted. `templateId` fills dataLimit/inbounds/expire from a user template; any field also given explicitly overrides the template value.',
  inputSchema: usersCreateInputSchema,
  outputSchema: usersCreateOutputSchema,
  scope: 'write',
  view: userView,
  handler: async (args, ctx) => {
    let dataLimit = args.dataLimit
    let inbounds = args.inbounds
    let expire = args.expire

    if (args.templateId !== undefined) {
      const template = await ctx.sdk.userTemplate.getUserTemplateEndpoint(args.templateId)
      if (dataLimit === undefined && typeof template.data_limit === 'number') dataLimit = template.data_limit
      if (inbounds === undefined && template.inbounds) inbounds = template.inbounds
      if (expire === undefined && typeof template.expire_duration === 'number' && template.expire_duration > 0) {
        expire = Math.floor(Date.now() / 1000) + template.expire_duration
      }
    }

    return ctx.sdk.user.addUser({
      username: args.username,
      status: args.status,
      data_limit: dataLimit,
      data_limit_reset_strategy: args.dataLimitResetStrategy,
      expire,
      note: args.note,
      proxies: args.proxies as Record<string, ProxySettings> | undefined,
      inbounds,
      on_hold_expire_duration: args.onHoldExpireDuration,
    })
  },
})

export const usersUpdateTool = defineTool({
  name: 'marzban_users_update',
  title: 'Update user',
  description:
    'Partially updates a user — only fields you provide are changed, everything else is left as-is. For status changes prefer marzban_users_activate/deactivate/hold (clearer intent, no need to know the raw status enum). For renewing an expiring/expired user prefer marzban_users_extend.',
  inputSchema: usersUpdateInputSchema,
  outputSchema: usersUpdateOutputSchema,
  scope: 'write',
  view: userView,
  handler: async (args, ctx) =>
    ctx.sdk.user.modifyUser(args.username, {
      data_limit: args.dataLimit,
      data_limit_reset_strategy: args.dataLimitResetStrategy,
      expire: args.expire,
      note: args.note,
      proxies: args.proxies as Record<string, ProxySettings> | undefined,
      inbounds: args.inbounds,
    }),
})

export const usersActivateTool = defineTool({
  name: 'marzban_users_activate',
  title: 'Activate user',
  description: "Sets a user's status to active.",
  inputSchema: usersActivateInputSchema,
  outputSchema: usersActivateOutputSchema,
  scope: 'write',
  view: userView,
  handler: async (args, ctx) => ctx.sdk.user.modifyUser(args.username, { status: 'active' }),
})

export const usersDeactivateTool = defineTool({
  name: 'marzban_users_deactivate',
  title: 'Deactivate user',
  description: "Sets a user's status to disabled, immediately blocking their access without deleting them.",
  inputSchema: usersDeactivateInputSchema,
  outputSchema: usersDeactivateOutputSchema,
  scope: 'write',
  view: userView,
  handler: async (args, ctx) => ctx.sdk.user.modifyUser(args.username, { status: 'disabled' }),
})

export const usersHoldTool = defineTool({
  name: 'marzban_users_hold',
  title: 'Put user on hold',
  description:
    "Sets a user's status to on_hold — inactive until their first connection, at which point the on-hold timer starts. Useful for provisioning an account ahead of time without starting its clock.",
  inputSchema: usersHoldInputSchema,
  outputSchema: usersHoldOutputSchema,
  scope: 'write',
  view: userView,
  handler: async (args, ctx) =>
    ctx.sdk.user.modifyUser(args.username, {
      status: 'on_hold',
      on_hold_expire_duration: args.onHoldExpireDuration,
    }),
})

export const usersExtendTool = defineTool({
  name: 'marzban_users_extend',
  title: 'Extend user subscription',
  description:
    'Renews a user: adds addDuration to their current expiration (or to now, if they have none or it already passed) and/or addData on top of their current data limit. If the user was expired or limited, status is moved back to active. Use this instead of marzban_users_update for renewals — it reads the current expire/limit first so the increment is relative, not an absolute overwrite.',
  inputSchema: usersExtendInputSchema,
  outputSchema: usersExtendOutputSchema,
  scope: 'write',
  view: userExtendedView,
  handler: async (args, ctx) => {
    const user = await ctx.sdk.user.getUser(args.username)
    const patch = buildRenewalPatch(user, { addDurationMs: args.addDuration, addDataBytes: args.addData })
    const updated = await ctx.sdk.user.modifyUser(args.username, patch)

    const parts: string[] = []
    if (patch.expire !== undefined) {
      parts.push(`expire moved to ${new Date(patch.expire * 1000).toISOString().slice(0, 10)}`)
    }
    if (patch.data_limit !== undefined) {
      parts.push(`data limit now ${patch.data_limit > 0 ? formatBytes(patch.data_limit) : 'unlimited'}`)
    }
    if (patch.status) parts.push('status reactivated to active')

    return { user: updated, note: parts.length > 0 ? parts.join('; ') : 'No changes applied.' }
  },
})

export const usersUsageTool = defineTool({
  name: 'marzban_users_usage',
  title: 'Get user traffic usage',
  description:
    'Reports how much data a user has used: total, lifetime total, their current limit, and a breakdown by node. `start`/`end` (ISO datetimes) narrow the per-node breakdown to a period; omit both for all-time.',
  inputSchema: usersUsageInputSchema,
  outputSchema: usersUsageOutputSchema,
  scope: 'read',
  view: userUsageView,
  handler: async (args, ctx) => {
    const [user, usage] = await Promise.all([
      ctx.sdk.user.getUser(args.username),
      ctx.sdk.user.getUserUsage(args.username, { start: args.start, end: args.end }),
    ])
    return {
      username: user.username,
      usedTraffic: user.used_traffic,
      lifetimeUsedTraffic: user.lifetime_used_traffic ?? 0,
      dataLimit: user.data_limit ?? null,
      byNode: usage.usages,
    }
  },
})

function expireDateOrNever(expire: number | null | undefined): string {
  return expire && expire > 0 ? new Date(expire * 1000).toISOString().slice(0, 10) : 'never'
}

export const usersDeleteTool = defineTool({
  name: 'marzban_users_delete',
  title: 'Delete user',
  description:
    'Permanently deletes a user, along with their subscription link and traffic history. Irreversible — requires confirmation. Prefer marzban_users_deactivate if you only need to block access without losing their data.',
  inputSchema: usersDeleteInputSchema,
  outputSchema: usersDeleteOutputSchema,
  scope: 'destructive',
  view: userDeletedView,
  describeConsequences: async (args, ctx) => {
    // Best-effort context, not a precondition for confirming: a panel
    // hiccup here must not turn "please confirm" into a raw network error —
    // the deletion is exactly as irreversible either way.
    try {
      const user = await ctx.sdk.user.getUser(args.username)
      return `This will permanently delete user "${args.username}" (status: ${user.status}, used ${formatBytes(user.used_traffic)}, expires ${expireDateOrNever(user.expire)}) and their subscription link. This cannot be undone.`
    } catch {
      return `This will permanently delete user "${args.username}" and their subscription link. This cannot be undone. (Could not fetch their current details to show here.)`
    }
  },
  handler: async (args, ctx) => {
    await ctx.sdk.user.removeUser(args.username)
    return { username: args.username, deleted: true as const }
  },
})

export const usersResetTrafficTool = defineTool({
  name: 'marzban_users_reset_traffic',
  title: 'Reset user data usage',
  description:
    'Resets used traffic back to zero for one user, or for every user at once when `all: true`. Does not change data_limit or expire. Irreversible — requires confirmation; `all: true` affects every user on the panel in one call.',
  inputSchema: usersResetTrafficInputSchema,
  outputSchema: usersResetTrafficOutputSchema,
  scope: 'destructive',
  view: usersResetTrafficView,
  describeConsequences: async (args, ctx) => {
    if (args.all) {
      return 'This will reset used traffic to zero for every user on the panel at once. This cannot be undone and cannot be scoped down afterward.'
    }
    if (!args.username) throw new ToolError('INVALID_ARGUMENTS', 'username is required unless all=true.')
    // Same best-effort reasoning as marzban_users_delete above.
    try {
      const user = await ctx.sdk.user.getUser(args.username)
      return `This will reset used traffic for "${args.username}" from ${formatBytes(user.used_traffic)} back to zero. This cannot be undone.`
    } catch {
      return `This will reset used traffic for "${args.username}" back to zero. This cannot be undone. (Could not fetch their current usage to show here.)`
    }
  },
  handler: async (args, ctx) => {
    if (args.all) {
      await ctx.sdk.user.resetUsersDataUsage()
      return { scope: 'all' as const, username: null, usedTraffic: null }
    }
    if (!args.username) throw new ToolError('INVALID_ARGUMENTS', 'username is required unless all=true.')
    const user = await ctx.sdk.user.resetUserDataUsage(args.username)
    return { scope: 'single' as const, username: user.username, usedTraffic: user.used_traffic }
  },
})
