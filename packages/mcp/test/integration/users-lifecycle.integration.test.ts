import { randomUUID } from 'node:crypto'

import type { ServerContext } from '@modelcontextprotocol/server'
import { isHttpError } from 'marzban-sdk'
import { describe, expect, it } from 'vitest'

import { createConfirmFn } from '../../src/core/confirm'
import type { ToolContext } from '../../src/core/tool'
import { configGetTool, configUpdateTool } from '../../src/modules/config/config.tools'
import {
  usersActivateTool,
  usersCreateTool,
  usersDeactivateTool,
  usersDeleteTool,
  usersExtendTool,
  usersUsageTool,
} from '../../src/modules/users/users.tools'
import { createTestToolContext } from './helpers/client'
import { freshConnectionConfig, removeUserTolerantly } from './helpers/quirks'

const SHADOWSOCKS_PROXY = { shadowsocks: {} }
const fakeServerCtx = {} as ServerContext

function uniqueUsername(prefix: string): string {
  return `mcp-it-${prefix}-${randomUUID().slice(0, 8)}`
}

/**
 * GitHub issue #65's Definition of Done asks for a live pass through the
 * full user lifecycle (create → extend → deactivate → activate → check
 * usage → delete) plus reading and dry-running a core config change —
 * exercised through the actual MCP tools, not the SDK directly.
 * smoke.integration.test.ts stays deliberately thin (see its own comment);
 * this file is the one place that walks every step end to end.
 */
describe('MCP full user lifecycle + config read/dry-run (real SDK, real panel)', () => {
  it('walks a user through create → extend → deactivate → activate → usage → delete', async () => {
    const ctx: ToolContext = await createTestToolContext()
    const username = uniqueUsername('lifecycle')
    let userDeleted = false

    try {
      const created = await usersCreateTool.handler({ username, status: 'active', proxies: SHADOWSOCKS_PROXY }, ctx)
      expect(created.username).toBe(username)
      expect(created.status).toBe('active')

      const extended = await usersExtendTool.handler({ username, addDuration: 30 * 86_400_000 }, ctx)
      expect(extended.user.expire).toBeGreaterThan(Math.floor(Date.now() / 1000))
      expect(extended.note).toContain('expire moved to')

      const deactivated = await usersDeactivateTool.handler({ username }, ctx)
      expect(deactivated.status).toBe('disabled')

      const activated = await usersActivateTool.handler({ username }, ctx)
      expect(activated.status).toBe('active')

      const usage = await usersUsageTool.handler({ username }, ctx)
      expect(usage.username).toBe(username)
      expect(usage.usedTraffic).toBe(0)
      expect(Array.isArray(usage.byNode)).toBe(true)

      // Through the real two-call confirm flow — same round trip as
      // smoke.integration.test.ts's marzban_users_delete case.
      const confirm = createConfirmFn()
      const args = { username }
      const first = await confirm({ tool: usersDeleteTool, args, ctx, serverCtx: fakeServerCtx })
      expect(first.proceed).toBe(false)
      const token = first.message!.match(/confirmToken: "([^"]+)"/)![1]
      const second = await confirm({
        tool: usersDeleteTool,
        args: { ...args, confirmToken: token },
        ctx,
        serverCtx: fakeServerCtx,
      })
      expect(second).toEqual({ proceed: true })

      try {
        const deleted = await usersDeleteTool.handler(args, ctx)
        expect(deleted).toEqual({ username, deleted: true })
      } catch (err) {
        // docs/marzban-quirks.md: DELETE 500s after actually removing the row.
        expect(isHttpError(err)).toBe(true)
        expect(isHttpError(err) && err.status).toBe(500)
      }
      userDeleted = true

      await expect(ctx.sdk.user.getUser(username, freshConnectionConfig())).rejects.toMatchObject({ status: 404 })
    } finally {
      // Only a safety net for a failure before the delete step above ran —
      // calling it again after a successful delete gets a 404 (not the
      // tolerated 500), and a `finally` that throws replaces whatever the
      // try block's own outcome was, masking the real failure.
      if (!userDeleted) await removeUserTolerantly(ctx.sdk, username)
      await ctx.sdk.destroy()
    }
  })

  it('reads the core config and dry-runs a no-op update without writing or restarting', async () => {
    const ctx: ToolContext = await createTestToolContext()

    try {
      const summary = await configGetTool.handler({}, ctx)
      expect(summary.mode).toBe('summary')
      expect(summary.summary).not.toBeNull()

      const raw = await configGetTool.handler({ section: 'raw' }, ctx)
      expect(raw.mode).toBe('raw')
      expect(raw.data).not.toBeNull()

      const dryRun = await configUpdateTool.handler({ config: raw.data as Record<string, unknown>, dryRun: true }, ctx)
      expect(dryRun.applied).toBe(false)
      expect(dryRun.restarted).toBe(false)
      expect(dryRun.backup).toBeNull()
      expect(dryRun.diff).toEqual({ addedKeys: [], removedKeys: [], changedKeys: [] })
    } finally {
      await ctx.sdk.destroy()
    }
  })
})
