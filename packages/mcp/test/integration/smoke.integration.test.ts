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
import { asSeenByStructuredClient, registerForCall, resultText } from './helpers/pipeline'
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
    // `reason: 'token'` is what tells the dedup store this is a human's fresh
    // re-approval rather than a retry, so it must survive the round trip.
    expect(second).toEqual({ proceed: true, reason: 'token' })

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

  it('marzban_users_delete: a repeated call replays the recorded result instead of deleting twice (#76)', async () => {
    const base = await createTestToolContext()
    // 'auto', not the helper's 'always': in 'always' a bare repeat is turned
    // away by confirmation and never reaches dedup, so the replay this test
    // exists to prove would be unobservable.
    ctx = { ...base, config: { ...base.config, confirm: 'auto' } }
    const username = uniqueUsername('dedup')
    await ctx.sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    const call = registerForCall(usersDeleteTool, ctx)

    const declined = await call({ username })
    expect(declined.isError).toBe(true)
    const token = resultText(declined).match(/confirmToken: "([^"]+)"/)![1]

    const executed = await call({ username, confirmToken: token })
    expect(executed.isError).toBeUndefined()
    expect(executed.structuredContent).toEqual({ _execution: { status: 'executed' }, username, deleted: true })

    // The retry a timing-out client sends: same arguments, no token. Before
    // #76 this reached the panel a second time and came back 404 — the user
    // is already gone, and removeUser only tolerates the 500 quirk, not a
    // 404. Getting the first call's result back is therefore proof the panel
    // was never asked again, not just that the shapes happen to match.
    const replayed = await call({ username })
    expect(replayed.isError).toBeUndefined()
    expect(replayed.structuredContent).toMatchObject({ username, deleted: true })
    // Through the projection a real client applies, not through `content`:
    // the notice being *written* was never the failure (#137), the notice
    // being *delivered* was.
    const seen = JSON.stringify(asSeenByStructuredClient(replayed))
    expect(seen).toContain('already ran')
    expect(seen).toContain('nothing was sent to the panel just now')
    // The fallback channel still carries it for clients that read only text.
    expect(resultText(replayed)).toContain('already ran')

    await expect(ctx.sdk.user.getUser(username, freshConnectionConfig())).rejects.toMatchObject({ status: 404 })
  })

  it('marzban_users_delete: a fresh confirmation runs the call for real instead of replaying it (#129)', async () => {
    const base = await createTestToolContext()
    // 'auto': the mode where the trust cache used to answer before the token
    // was even read, so a deliberate re-run was replayed instead of executed.
    ctx = { ...base, config: { ...base.config, confirm: 'auto' } }
    const username = uniqueUsername('rerun')
    await ctx.sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    const call = registerForCall(usersDeleteTool, ctx)

    const declined = await call({ username })
    const token = resultText(declined).match(/confirmToken: "([^"]+)"/)![1]
    expect((await call({ username, confirmToken: token })).isError).toBeUndefined()
    await expect(ctx.sdk.user.getUser(username, freshConnectionConfig())).rejects.toMatchObject({ status: 404 })

    // The same user, recreated: the call's arguments are identical, so both
    // the trust cache and the dedup store still hold the first run.
    await ctx.sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    const replayed = await call({ username })
    expect(JSON.stringify(asSeenByStructuredClient(replayed))).toContain('already ran')
    // Proof it really was a replay and not a second delete — and the panel
    // state is the proof, not just the response shape.
    await expect(ctx.sdk.user.getUser(username, freshConnectionConfig())).resolves.toMatchObject({ username })

    // The token the replay notice hands back. Before #129 there was none to
    // hand back, and presenting one would have been swallowed by the trust
    // cache anyway.
    // Read out of `structuredContent`, not `content`: a hint the model cannot
    // see is a hint that does not exist (#137).
    const notice = (replayed.structuredContent as { _execution: { notice: string } })._execution.notice
    const rerunToken = notice.match(/confirmToken: "([^"]+)" to run it for real/)![1]

    const rerun = await call({ username, confirmToken: rerunToken })
    expect(rerun.isError).toBeUndefined()
    expect(resultText(rerun)).not.toContain('already ran')
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
