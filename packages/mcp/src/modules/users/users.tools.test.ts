import type { MarzbanSDK, UserResponse } from 'marzban-sdk'
import { describe, expect, it, vi } from 'vitest'

import type { McpConfig } from '@/config'
import type { ToolContext } from '@/core/tool'

import {
  usersActivateTool,
  usersCreateTool,
  usersDeactivateTool,
  usersDeleteTool,
  usersExtendTool,
  usersGetTool,
  usersHoldTool,
  usersListTool,
  usersResetTrafficTool,
  usersUpdateTool,
  usersUsageTool,
} from './users.tools'

function makeUser(overrides: Partial<UserResponse> = {}): UserResponse {
  return {
    proxies: {},
    username: 'alice',
    status: 'active',
    used_traffic: 0,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeContext(sdkOverrides: Record<string, unknown> = {}): ToolContext {
  return {
    sdk: sdkOverrides as unknown as MarzbanSDK,
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    config: {} as McpConfig,
  }
}

describe('usersListTool', () => {
  it('clamps limit, defaults offset to 0, and forwards search/status', async () => {
    const getUsers = vi.fn().mockResolvedValue({ users: [makeUser()], total: 1 })
    const ctx = makeContext({ user: { getUsers } })

    const result = await usersListTool.handler({ search: 'ali', status: 'active', limit: 500 }, ctx)

    expect(getUsers).toHaveBeenCalledWith({ search: 'ali', status: 'active', limit: 100, offset: 0 })
    expect(result).toEqual({ users: [makeUser()], total: 1, note: 'Showing all 1.' })
  })

  it('reports a partial page via the pagination note', async () => {
    const getUsers = vi.fn().mockResolvedValue({ users: [makeUser()], total: 50 })
    const ctx = makeContext({ user: { getUsers } })

    const result = await usersListTool.handler({ offset: 10 }, ctx)

    expect(getUsers).toHaveBeenCalledWith({ search: undefined, status: undefined, limit: 25, offset: 10 })
    expect(result.note).toBe('Showing 1 of 50 (offset=10). Pass a higher offset to see more.')
  })
})

describe('usersGetTool', () => {
  it('fetches the user and attaches a computed summary', async () => {
    const user = makeUser({ data_limit: 1000, used_traffic: 250 })
    const getUser = vi.fn().mockResolvedValue(user)
    const ctx = makeContext({ user: { getUser } })

    const result = await usersGetTool.handler({ username: 'alice' }, ctx)

    expect(getUser).toHaveBeenCalledWith('alice')
    expect(result.user).toBe(user)
    expect(result.summary).toMatchObject({ dataLeftBytes: 750, usagePercent: 25 })
  })
})

describe('usersCreateTool', () => {
  it('passes explicit fields straight through to addUser', async () => {
    const addUser = vi.fn().mockResolvedValue(makeUser())
    const ctx = makeContext({ user: { addUser } })

    await usersCreateTool.handler(
      { username: 'alice', status: 'active', dataLimit: 1000, note: 'vip', proxies: { vless: { id: 'x' } } },
      ctx
    )

    expect(addUser).toHaveBeenCalledWith({
      username: 'alice',
      status: 'active',
      data_limit: 1000,
      data_limit_reset_strategy: undefined,
      expire: undefined,
      note: 'vip',
      proxies: { vless: { id: 'x' } },
      inbounds: undefined,
      on_hold_expire_duration: undefined,
    })
  })

  it('fills data_limit/inbounds/expire from a template when templateId is given', async () => {
    const addUser = vi.fn().mockResolvedValue(makeUser())
    const getUserTemplateEndpoint = vi.fn().mockResolvedValue({
      id: 1,
      data_limit: 2000,
      expire_duration: 30 * 86_400,
      inbounds: { vless: ['tag1'] },
    })
    const ctx = makeContext({ user: { addUser }, userTemplate: { getUserTemplateEndpoint } })

    const before = Date.now()
    await usersCreateTool.handler({ username: 'alice', templateId: 1 }, ctx)
    const after = Date.now()

    expect(getUserTemplateEndpoint).toHaveBeenCalledWith(1)
    const call = addUser.mock.calls[0][0]
    expect(call.data_limit).toBe(2000)
    expect(call.inbounds).toEqual({ vless: ['tag1'] })
    expect(call.expire).toBeGreaterThanOrEqual(Math.floor(before / 1000) + 30 * 86_400)
    expect(call.expire).toBeLessThanOrEqual(Math.floor(after / 1000) + 30 * 86_400 + 1)
  })

  it('lets explicit fields override the template defaults', async () => {
    const addUser = vi.fn().mockResolvedValue(makeUser())
    const getUserTemplateEndpoint = vi
      .fn()
      .mockResolvedValue({ id: 1, data_limit: 2000, inbounds: { vless: ['tag1'] } })
    const ctx = makeContext({ user: { addUser }, userTemplate: { getUserTemplateEndpoint } })

    await usersCreateTool.handler({ username: 'alice', templateId: 1, dataLimit: 9999 }, ctx)

    expect(addUser.mock.calls[0][0].data_limit).toBe(9999)
  })

  it('does not call the template endpoint when templateId is omitted', async () => {
    const addUser = vi.fn().mockResolvedValue(makeUser())
    const getUserTemplateEndpoint = vi.fn()
    const ctx = makeContext({ user: { addUser }, userTemplate: { getUserTemplateEndpoint } })

    await usersCreateTool.handler({ username: 'alice' }, ctx)

    expect(getUserTemplateEndpoint).not.toHaveBeenCalled()
  })

  it('ignores a template with no expire_duration', async () => {
    const addUser = vi.fn().mockResolvedValue(makeUser())
    const getUserTemplateEndpoint = vi.fn().mockResolvedValue({ id: 1 })
    const ctx = makeContext({ user: { addUser }, userTemplate: { getUserTemplateEndpoint } })

    await usersCreateTool.handler({ username: 'alice', templateId: 1 }, ctx)

    expect(addUser.mock.calls[0][0].expire).toBeUndefined()
  })
})

describe('usersUpdateTool', () => {
  it('forwards only the provided fields, leaving the rest undefined', async () => {
    const modifyUser = vi.fn().mockResolvedValue(makeUser())
    const ctx = makeContext({ user: { modifyUser } })

    await usersUpdateTool.handler({ username: 'alice', note: 'updated' }, ctx)

    expect(modifyUser).toHaveBeenCalledWith('alice', {
      data_limit: undefined,
      data_limit_reset_strategy: undefined,
      expire: undefined,
      note: 'updated',
      proxies: undefined,
      inbounds: undefined,
    })
  })
})

describe('usersActivateTool / usersDeactivateTool / usersHoldTool', () => {
  it('activate sets status to active', async () => {
    const modifyUser = vi.fn().mockResolvedValue(makeUser({ status: 'active' }))
    const ctx = makeContext({ user: { modifyUser } })
    await usersActivateTool.handler({ username: 'alice' }, ctx)
    expect(modifyUser).toHaveBeenCalledWith('alice', { status: 'active' })
  })

  it('deactivate sets status to disabled', async () => {
    const modifyUser = vi.fn().mockResolvedValue(makeUser({ status: 'disabled' }))
    const ctx = makeContext({ user: { modifyUser } })
    await usersDeactivateTool.handler({ username: 'alice' }, ctx)
    expect(modifyUser).toHaveBeenCalledWith('alice', { status: 'disabled' })
  })

  it('hold sets status to on_hold with the given duration', async () => {
    const modifyUser = vi.fn().mockResolvedValue(makeUser({ status: 'on_hold' }))
    const ctx = makeContext({ user: { modifyUser } })
    await usersHoldTool.handler({ username: 'alice', onHoldExpireDuration: 3600 }, ctx)
    expect(modifyUser).toHaveBeenCalledWith('alice', { status: 'on_hold', on_hold_expire_duration: 3600 })
  })
})

describe('usersExtendTool', () => {
  it('reads the current user, applies the renewal patch, and reports what changed', async () => {
    const futureExpire = Math.floor(Date.now() / 1000) + 5 * 86_400
    const user = makeUser({ expire: futureExpire, data_limit: 1000, status: 'active' })
    const getUser = vi.fn().mockResolvedValue(user)
    const updated = makeUser({ expire: futureExpire + 30 * 86_400, data_limit: 2000 })
    const modifyUser = vi.fn().mockResolvedValue(updated)
    const ctx = makeContext({ user: { getUser, modifyUser } })

    const result = await usersExtendTool.handler(
      { username: 'alice', addDuration: 30 * 86_400_000, addData: 1000 },
      ctx
    )

    expect(getUser).toHaveBeenCalledWith('alice')
    expect(modifyUser).toHaveBeenCalledWith('alice', { expire: futureExpire + 30 * 86_400, data_limit: 2000 })
    expect(result.user).toBe(updated)
    expect(result.note).toContain('expire moved to')
    expect(result.note).toContain('data limit now')
  })

  it('reports reactivation when the user was expired', async () => {
    const user = makeUser({ status: 'expired', expire: Math.floor(Date.now() / 1000) - 86_400 })
    const getUser = vi.fn().mockResolvedValue(user)
    const modifyUser = vi.fn().mockResolvedValue(makeUser({ status: 'active' }))
    const ctx = makeContext({ user: { getUser, modifyUser } })

    const result = await usersExtendTool.handler({ username: 'alice', addDuration: 86_400_000 }, ctx)

    expect(result.note).toContain('status reactivated to active')
  })

  it('reports "unlimited" when the resulting data_limit is 0', async () => {
    const user = makeUser({ data_limit: 0 })
    const getUser = vi.fn().mockResolvedValue(user)
    const modifyUser = vi.fn().mockResolvedValue(user)
    const ctx = makeContext({ user: { getUser, modifyUser } })

    const result = await usersExtendTool.handler({ username: 'alice', addData: 1000 }, ctx)

    expect(result.note).toContain('data limit now unlimited')
  })

  it('reports "No changes applied." when the patch ends up empty', async () => {
    // addDuration/addData are individually optional in the patch builder even
    // though the schema-level refine requires at least one — this exercises
    // the handler's own fallback message for a fully-empty patch.
    const user = makeUser({ status: 'active' })
    const getUser = vi.fn().mockResolvedValue(user)
    const modifyUser = vi.fn().mockResolvedValue(user)
    const ctx = makeContext({ user: { getUser, modifyUser } })

    const result = await usersExtendTool.handler({ username: 'alice' }, ctx)

    expect(result.note).toBe('No changes applied.')
  })
})

describe('usersUsageTool', () => {
  it('combines the user and its per-node usage breakdown', async () => {
    const user = makeUser({ used_traffic: 300, lifetime_used_traffic: 900, data_limit: 1000 })
    const getUser = vi.fn().mockResolvedValue(user)
    const getUserUsage = vi
      .fn()
      .mockResolvedValue({ username: 'alice', usages: [{ node_name: 'node-1', used_traffic: 300 }] })
    const ctx = makeContext({ user: { getUser, getUserUsage } })

    const result = await usersUsageTool.handler({ username: 'alice', start: '2026-01-01', end: '2026-02-01' }, ctx)

    expect(getUserUsage).toHaveBeenCalledWith('alice', { start: '2026-01-01', end: '2026-02-01' })
    expect(result).toEqual({
      username: 'alice',
      usedTraffic: 300,
      lifetimeUsedTraffic: 900,
      dataLimit: 1000,
      byNode: [{ node_name: 'node-1', used_traffic: 300 }],
    })
  })

  it('defaults lifetimeUsedTraffic to 0 and dataLimit to null when unset', async () => {
    const user = makeUser()
    const getUser = vi.fn().mockResolvedValue(user)
    const getUserUsage = vi.fn().mockResolvedValue({ username: 'alice', usages: [] })
    const ctx = makeContext({ user: { getUser, getUserUsage } })

    const result = await usersUsageTool.handler({ username: 'alice' }, ctx)

    expect(result.lifetimeUsedTraffic).toBe(0)
    expect(result.dataLimit).toBeNull()
  })
})

describe('usersDeleteTool', () => {
  it('removes the user and reports it as deleted', async () => {
    const removeUser = vi.fn().mockResolvedValue(undefined)
    const ctx = makeContext({ user: { removeUser } })

    const result = await usersDeleteTool.handler({ username: 'alice' }, ctx)

    expect(removeUser).toHaveBeenCalledWith('alice')
    expect(result).toEqual({ username: 'alice', deleted: true })
  })

  it('describes the consequences using the current user, including a future expire date', async () => {
    const futureExpire = Math.floor(Date.now() / 1000) + 86_400
    const user = makeUser({ status: 'active', used_traffic: 12_345, expire: futureExpire })
    const getUser = vi.fn().mockResolvedValue(user)
    const ctx = makeContext({ user: { getUser } })

    const text = await usersDeleteTool.describeConsequences!({ username: 'alice' }, ctx)

    expect(getUser).toHaveBeenCalledWith('alice')
    expect(text).toContain('permanently delete user "alice"')
    expect(text).toContain('status: active')
    expect(text).toContain(new Date(futureExpire * 1000).toISOString().slice(0, 10))
  })

  it('describes an unset expire as "never"', async () => {
    const user = makeUser({ expire: undefined })
    const getUser = vi.fn().mockResolvedValue(user)
    const ctx = makeContext({ user: { getUser } })

    const text = await usersDeleteTool.describeConsequences!({ username: 'alice' }, ctx)

    expect(text).toContain('expires never')
  })

  it('falls back to a generic description when the panel is unreachable', async () => {
    const getUser = vi.fn().mockRejectedValue(new Error('network error'))
    const ctx = makeContext({ user: { getUser } })

    const text = await usersDeleteTool.describeConsequences!({ username: 'alice' }, ctx)

    expect(text).toContain('permanently delete user "alice"')
    expect(text).toContain('Could not fetch their current details')
  })
})

describe('usersResetTrafficTool', () => {
  it('resets a single user and reports their new usage', async () => {
    const resetUserDataUsage = vi.fn().mockResolvedValue(makeUser({ used_traffic: 0 }))
    const ctx = makeContext({ user: { resetUserDataUsage } })

    const result = await usersResetTrafficTool.handler({ username: 'alice' }, ctx)

    expect(resetUserDataUsage).toHaveBeenCalledWith('alice')
    expect(result).toEqual({ scope: 'single', username: 'alice', usedTraffic: 0 })
  })

  it('resets every user when all=true', async () => {
    const resetUsersDataUsage = vi.fn().mockResolvedValue(undefined)
    const ctx = makeContext({ user: { resetUsersDataUsage } })

    const result = await usersResetTrafficTool.handler({ all: true }, ctx)

    expect(resetUsersDataUsage).toHaveBeenCalled()
    expect(result).toEqual({ scope: 'all', username: null, usedTraffic: null })
  })

  it('throws if neither username nor all is given, even though the schema already guards this', async () => {
    const ctx = makeContext({})
    await expect(usersResetTrafficTool.handler({}, ctx)).rejects.toThrow('username is required unless all=true.')
  })

  it('describes resetting a single user, including their current usage', async () => {
    const user = makeUser({ used_traffic: 5_000_000 })
    const getUser = vi.fn().mockResolvedValue(user)
    const ctx = makeContext({ user: { getUser } })

    const text = await usersResetTrafficTool.describeConsequences!({ username: 'alice' }, ctx)

    expect(getUser).toHaveBeenCalledWith('alice')
    expect(text).toContain('reset used traffic for "alice"')
  })

  it('describes resetting all users without touching the SDK', async () => {
    const getUser = vi.fn()
    const ctx = makeContext({ user: { getUser } })

    const text = await usersResetTrafficTool.describeConsequences!({ all: true }, ctx)

    expect(getUser).not.toHaveBeenCalled()
    expect(text).toContain('every user on the panel')
  })

  it('describeConsequences throws if neither username nor all is given', async () => {
    const ctx = makeContext({})
    await expect(usersResetTrafficTool.describeConsequences!({}, ctx)).rejects.toThrow(
      'username is required unless all=true.'
    )
  })

  it('describeConsequences falls back to a generic description when the panel is unreachable', async () => {
    const getUser = vi.fn().mockRejectedValue(new Error('network error'))
    const ctx = makeContext({ user: { getUser } })

    const text = await usersResetTrafficTool.describeConsequences!({ username: 'alice' }, ctx)

    expect(text).toContain('reset used traffic for "alice"')
    expect(text).toContain('Could not fetch their current usage')
  })
})
