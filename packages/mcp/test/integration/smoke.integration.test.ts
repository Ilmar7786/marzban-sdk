import { randomUUID } from 'node:crypto'

import type { ServerContext } from '@modelcontextprotocol/server'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { isHttpError } from 'marzban-sdk'
import { afterAll, describe, expect, it } from 'vitest'

import { createConfirmFn } from '../../src/core/confirm'
import { type ToolContext, toolOutputJsonSchema } from '../../src/core/tool'
import { nodesListTool } from '../../src/modules/nodes/nodes.tools'
import { usersCreateTool, usersDeleteTool, usersExtendTool } from '../../src/modules/users/users.tools'
import { createTestToolContext } from './helpers/client'
import { freshConnectionConfig, removeUserTolerantly } from './helpers/quirks'

// Same validator shape a strict MCP client applies to structuredContent: a
// real ajv instance with format assertions ON, checking the exact JSON
// Schema @modelcontextprotocol/server derives from a tool's outputSchema
// (see src/core/tool/json-schema.ts). A zod .safeParse() can't reproduce
// this — it's oblivious to the `format` keyword entirely, which is exactly
// how #112 shipped unnoticed. `strict: false` because the concern here is
// format *assertion*, not ajv's opinions on schema-authoring style — kubb's
// generated schemas aren't written for ajv's strict mode and that's a
// separate axis from the bug this test exists to catch.
const strictClientValidator = addFormats(new Ajv2020({ strict: false }))

const SHADOWSOCKS_PROXY = { shadowsocks: {} }
const fakeServerCtx = {} as ServerContext

function uniqueUsername(prefix: string): string {
  return `mcp-it-${prefix}-${randomUUID().slice(0, 8)}`
}

/**
 * Not a re-run of the SDK's edge-case suite (packages/sdk/test/integration)
 * — MCP tools are already proven to call the SDK correctly by their mocked
 * unit tests. This exists to catch what those can't: real drift between an
 * MCP tool's zod schema and the SDK's actual types, and MCP-only logic
 * (confirm-flow, renewal-patch math) running end to end against a real
 * panel.
 */
describe('MCP tool smoke tests (real SDK, real panel)', () => {
  let ctx: ToolContext

  afterAll(async () => {
    await ctx.sdk.destroy()
  })

  it('marzban_nodes_list: thin passthrough returns real, correctly-shaped data', async () => {
    ctx = await createTestToolContext()

    const result = await nodesListTool.handler({}, ctx)

    expect(Array.isArray(result.nodes)).toBe(true)
    expect(Array.isArray(result.usage)).toBe(true)
  })

  it('marzban_users_extend: MCP-side renewal-patch logic against a real user', async () => {
    ctx = await createTestToolContext()
    const username = uniqueUsername('extend')
    const created = await ctx.sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })
    expect(created.expire).toBeNull()

    try {
      const result = await usersExtendTool.handler({ username, addDuration: 30 * 86_400_000 }, ctx)

      expect(result.user.expire).toBeGreaterThan(Math.floor(Date.now() / 1000))
      expect(result.note).toContain('expire moved to')
    } finally {
      await removeUserTolerantly(ctx.sdk, username)
    }
  })

  it('marzban_users_delete: confirm-flow round trip actually deletes through the real SDK', async () => {
    ctx = await createTestToolContext()
    const username = uniqueUsername('delete')
    await ctx.sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    const confirm = createConfirmFn()
    const args = { username }

    const first = await confirm({ tool: usersDeleteTool, args, ctx, serverCtx: fakeServerCtx })
    expect(first.proceed).toBe(false)
    expect(first.message).toContain(`permanently delete user "${username}"`)
    const token = first.message!.match(/confirmToken: "([^"]+)"/)![1]

    const second = await confirm({
      tool: usersDeleteTool,
      args: { ...args, confirmToken: token },
      ctx,
      serverCtx: fakeServerCtx,
    })
    expect(second).toEqual({ proceed: true })

    try {
      const result = await usersDeleteTool.handler(args, ctx)
      expect(result).toEqual({ username, deleted: true })
    } catch (err) {
      // docs/marzban-quirks.md: DELETE 500s after actually removing the row.
      expect(isHttpError(err)).toBe(true)
      expect(isHttpError(err) && err.status).toBe(500)
    }

    await expect(ctx.sdk.user.getUser(username, freshConnectionConfig())).rejects.toMatchObject({ status: 404 })
  })

  it('marzban_users_create: structuredContent validates under a strict client, even though Marzban returns created_at without a UTC offset (#112)', async () => {
    ctx = await createTestToolContext()
    const username = uniqueUsername('datetime')

    try {
      const result = await usersCreateTool.handler({ username, status: 'active', proxies: SHADOWSOCKS_PROXY }, ctx)

      // Guards the guard: if Marzban ever starts sending an offset, this
      // assertion fails first — signaling the check below stopped exercising
      // the thing #112 was actually about.
      expect(result.created_at).not.toMatch(/(Z|[+-]\d{2}:\d{2})$/)

      const validate = strictClientValidator.compile(toolOutputJsonSchema(usersCreateTool.outputSchema))
      const valid = validate(result)

      expect(validate.errors ?? []).toEqual([])
      expect(valid).toBe(true)
    } finally {
      await removeUserTolerantly(ctx.sdk, username)
    }
  })
})
