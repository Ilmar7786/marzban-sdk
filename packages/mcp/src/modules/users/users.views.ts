import { formatBytes, humanRemaining, type UserResponse, type UserUsageResponse } from 'marzban-sdk'

import type { View, ViewOptions, ViewRow } from '@/format/views/types'

import type { UserSummary } from './users.helpers'

const HIDDEN_SUFFIX = '(hidden — set MARZBAN_MCP_SHOW_LINKS=true to reveal)'

function usageDisplay(user: UserResponse): string {
  const used = formatBytes(user.used_traffic)
  if (!user.data_limit || user.data_limit <= 0) return `${used} / unlimited`
  return `${used} / ${formatBytes(user.data_limit)}`
}

function expireDisplay(user: UserResponse): string {
  if (!user.expire || user.expire <= 0) return 'never'
  const date = new Date(user.expire * 1000).toISOString().slice(0, 10)
  return `${date} (${humanRemaining(user.expire * 1000)})`
}

function maskProxies(proxies: UserResponse['proxies'], showLinks: boolean): string {
  const protocols = Object.keys(proxies)
  if (protocols.length === 0) return '(none)'
  if (showLinks) return JSON.stringify(proxies)
  return `${protocols.join(', ')} ${HIDDEN_SUFFIX}`
}

function maskSubscriptionUrl(url: string | undefined, showLinks: boolean): string {
  if (!url) return ''
  if (showLinks) return url
  try {
    return `${new URL(url).origin}/*** ${HIDDEN_SUFFIX}`
  } catch {
    return `*** ${HIDDEN_SUFFIX}`
  }
}

function maskLinks(links: string[] | undefined, showLinks: boolean): string {
  if (!links || links.length === 0) return '(none)'
  if (showLinks) return links.join(', ')
  return `${links.length} link(s) ${HIDDEN_SUFFIX}`
}

function userCompactRow(user: UserResponse): ViewRow {
  return {
    username: user.username,
    status: user.status,
    usage: usageDisplay(user),
    expire: expireDisplay(user),
    online_at: user.online_at ?? 'never',
  }
}

function userFullRow(user: UserResponse, options: ViewOptions): ViewRow {
  return {
    ...userCompactRow(user),
    note: user.note ?? '',
    data_limit_reset_strategy: user.data_limit_reset_strategy ?? 'no_reset',
    proxies: maskProxies(user.proxies, options.showLinks),
    inbounds: user.inbounds && Object.keys(user.inbounds).length > 0 ? JSON.stringify(user.inbounds) : '(all)',
    excluded_inbounds:
      user.excluded_inbounds && Object.keys(user.excluded_inbounds).length > 0
        ? JSON.stringify(user.excluded_inbounds)
        : '(none)',
    subscription_url: maskSubscriptionUrl(user.subscription_url, options.showLinks),
    links: maskLinks(user.links, options.showLinks),
    created_at: user.created_at,
  }
}

/** Single-user views (`users_get`/`create`/`update`/`activate`/`deactivate`/`hold`) — the raw `UserResponse` all of those return. */
export const userView: View<UserResponse> = {
  compact: userCompactRow,
  full: userFullRow,
}

export interface UserWithSummary {
  user: UserResponse
  summary: UserSummary
}

/** `users_get`'s view — adds the computed summary fields (days/data left, usage %) on top of the plain user row. */
export const userWithSummaryView: View<UserWithSummary> = {
  compact: ({ user, summary }) => ({
    ...userCompactRow(user),
    days_left: summary.daysLeft ?? '—',
    usage_percent: summary.usagePercent ?? '—',
  }),
  full: ({ user, summary }, options) => ({
    ...userFullRow(user, options),
    days_left: summary.daysLeft ?? '—',
    data_left: summary.dataLeftBytes !== null ? formatBytes(summary.dataLeftBytes) : '—',
    usage_percent: summary.usagePercent !== null ? `${summary.usagePercent.toFixed(1)}%` : '—',
    is_expired: summary.isExpired,
  }),
}

export interface UserList {
  users: UserResponse[]
  total: number
  note: string
}

/** `users_list`'s view — one compact row per user, plus a trailing pagination-note row (plan §5: never silently truncate a list). */
export const userListView: View<UserList> = {
  compact: ({ users, note }) => [...users.map(userCompactRow), { note }],
  full: ({ users, note }, options) => [...users.map(user => userFullRow(user, options)), { note }],
}

export interface UserExtended {
  user: UserResponse
  note: string
}

export const userExtendedView: View<UserExtended> = {
  compact: ({ user, note }) => ({ ...userCompactRow(user), note }),
  full: ({ user, note }, options) => ({ ...userFullRow(user, options), note }),
}

export interface UserUsage {
  username: string
  usedTraffic: number
  lifetimeUsedTraffic: number
  dataLimit: number | null
  byNode: UserUsageResponse[]
}

function nodeUsageRow(node: UserUsageResponse): ViewRow {
  return { node: node.node_name, used: formatBytes(node.used_traffic) }
}

export const userUsageView: View<UserUsage> = {
  compact: usage => [
    {
      username: usage.username,
      used_traffic: formatBytes(usage.usedTraffic),
      lifetime_used_traffic: formatBytes(usage.lifetimeUsedTraffic),
      data_limit: usage.dataLimit && usage.dataLimit > 0 ? formatBytes(usage.dataLimit) : 'unlimited',
    },
    ...usage.byNode.map(nodeUsageRow),
  ],
}
