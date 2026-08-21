import { formatBytes, type SubscriptionUserResponse } from 'marzban-sdk'

import type { View } from '@/format/views/types'

import { userView } from '../users/users.views'

function usageDisplay(user: SubscriptionUserResponse): string {
  const used = formatBytes(user.used_traffic)
  if (!user.data_limit || user.data_limit <= 0) return `${used} / unlimited`
  return `${used} / ${formatBytes(user.data_limit)}`
}

function expireDisplay(user: SubscriptionUserResponse): string {
  if (!user.expire || user.expire <= 0) return 'never'
  return new Date(user.expire * 1000).toISOString().slice(0, 10)
}

export const subscriptionInfoView: View<SubscriptionUserResponse> = {
  compact: user => ({
    username: user.username,
    status: user.status,
    usage: usageDisplay(user),
    expire: expireDisplay(user),
    sub_updated_at: user.sub_updated_at ?? 'never',
  }),
}

// marzban_users_revoke_subscription returns a plain UserResponse — reuse the
// users module's own view rather than duplicating its formatting.
export const usersRevokeSubscriptionView = userView
