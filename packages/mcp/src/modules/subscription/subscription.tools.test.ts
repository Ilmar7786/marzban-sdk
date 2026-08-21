import type { MarzbanSDK } from 'marzban-sdk'
import { describe, expect, it, vi } from 'vitest'

import type { McpConfig } from '@/config'
import type { ToolContext } from '@/core/tool'

import { subscriptionInfoTool, usersRevokeSubscriptionTool } from './subscription.tools'

function makeContext(sdkOverrides: Record<string, unknown> = {}): ToolContext {
  return {
    sdk: sdkOverrides as unknown as MarzbanSDK,
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    config: {} as McpConfig,
  }
}

describe('subscriptionInfoTool', () => {
  it('fetches subscription info by token', async () => {
    const info = { username: 'alice', status: 'active' }
    const userSubscriptionInfo = vi.fn().mockResolvedValue(info)
    const ctx = makeContext({ subscription: { userSubscriptionInfo } })

    const result = await subscriptionInfoTool.handler({ subscriptionToken: 'deadbeef' }, ctx)

    expect(userSubscriptionInfo).toHaveBeenCalledWith('deadbeef')
    expect(result).toBe(info)
  })
})

describe('usersRevokeSubscriptionTool', () => {
  it('revokes the subscription and returns the updated user', async () => {
    const user = { username: 'alice', subscription_url: 'https://panel.example.com/sub/new' }
    const revokeUserSubscription = vi.fn().mockResolvedValue(user)
    const ctx = makeContext({ user: { revokeUserSubscription } })

    const result = await usersRevokeSubscriptionTool.handler({ username: 'alice' }, ctx)

    expect(revokeUserSubscription).toHaveBeenCalledWith('alice')
    expect(result).toBe(user)
  })

  it('describeConsequences names the user and explains what breaks', async () => {
    const text = await usersRevokeSubscriptionTool.describeConsequences!({ username: 'alice' }, makeContext())
    expect(text).toContain('"alice"')
    expect(text).toContain('cannot be undone')
  })
})
