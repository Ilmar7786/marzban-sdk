import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { HttpError, MarzbanSDK } from '../../src/index'
import { createTestAdmin, removeAdminTolerantly } from './helpers/adminFixture'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { createTestNode, removeNodeTolerantly, waitForNodeSettled } from './helpers/nodeFixture'

// Every test here creates nodes with add_as_new_host: false, so nothing
// touches the panel's proxy host map — the one node test that does
// (add_as_new_host: true) lives in its own file, node-hosts.integration.test.ts,
// with the snapshot/restore lifecycle that kind of panel-wide mutation needs.
describe('node integration (settings, usage, CRUD)', () => {
  let sdk: MarzbanSDK
  const cleanup = createCleanupRegistry()

  beforeAll(async () => {
    sdk = await createTestSdk()
  })

  afterEach(async () => {
    await cleanup.runAll()
  })

  afterAll(async () => {
    await sdk.destroy()
  })

  it('returns the node client certificate and minimum version from getNodeSettings', async () => {
    const settings = await sdk.node.getNodeSettings()

    expect(settings.certificate).toContain('-----BEGIN CERTIFICATE-----')
    expect(settings.min_node_version).toEqual(expect.any(String))
  })

  it('returns per-node usage including the master node with a null node_id', async () => {
    const usage = await sdk.node.getUsage()

    expect(Array.isArray(usage.usages)).toBe(true)
    const master = usage.usages.find(u => u.node_name === 'Master')
    expect(master).toBeDefined()
    expect(master!.node_id).toBeNull()
    for (const entry of usage.usages) {
      expect(entry.node_name).toEqual(expect.any(String))
      expect(Number.isInteger(entry.uplink)).toBe(true)
      expect(Number.isInteger(entry.downlink)).toBe(true)
    }
  })

  it('creates, fetches, lists, partially updates, and removes a node (happy path)', async () => {
    const name = uniqueTestName('node-happy')

    const created = await createTestNode(sdk, { name, port: 62060, api_port: 62061, usage_coefficient: 2 })
    cleanup.register(() => removeNodeTolerantly(sdk, created.id))
    expect(created.name).toBe(name)
    expect(created.address).toBe('127.0.0.1')
    expect(created.port).toBe(62060)
    expect(created.api_port).toBe(62061)
    // docs/marzban-quirks.md: addNode ignores usage_coefficient on create —
    // always stores 1, regardless of the 2 requested above.
    expect(created.usage_coefficient).toBe(1)
    // Unreachable address (see nodeFixture.ts) — the node never reaches
    // 'connected' on this stand, only 'connecting' or 'error'.
    expect(['connecting', 'error']).toContain(created.status)

    const fetched = await sdk.node.getNode(created.id)
    expect(fetched).toEqual(created)

    const listed = await sdk.node.getNodes()
    expect(listed.map(n => n.id)).toContain(created.id)

    // Partial PATCH semantics: only usage_coefficient is sent, name/address/ports unchanged.
    const modified = await sdk.node.modifyNode(created.id, { usage_coefficient: 3.5 })
    expect(modified.usage_coefficient).toBe(3.5)
    expect(modified.name).toBe(name)
    expect(modified.address).toBe(created.address)
    expect(modified.port).toBe(created.port)

    await sdk.node.removeNode(created.id)
    await expect(sdk.node.getNode(created.id)).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
  })

  it('modifying a node to status: disabled clears the connection error and is stable on read', async () => {
    const created = await createTestNode(sdk)
    cleanup.register(() => removeNodeTolerantly(sdk, created.id))

    // docs/marzban-quirks.md: addNode fires an async connection attempt
    // immediately; modifying the node while it's still in flight races it.
    // Waiting for it to settle first makes the disable below deterministic.
    const settled = await waitForNodeSettled(sdk, created.id)
    expect(settled.status).toBe('error')
    expect(settled.message).toEqual(expect.any(String))

    const modified = await sdk.node.modifyNode(created.id, { status: 'disabled' })
    expect(modified.status).toBe('disabled')
    expect(modified.message).toBeNull()

    const fetched = await sdk.node.getNode(created.id)
    expect(fetched.status).toBe('disabled')
    expect(fetched.message).toBeNull()
  })

  it('rejects creating a node with a name that already exists', async () => {
    const name = uniqueTestName('node-dup')
    const created = await createTestNode(sdk, { name })
    cleanup.register(() => removeNodeTolerantly(sdk, created.id))

    await expect(createTestNode(sdk, { name, address: '127.0.0.2' })).rejects.toMatchObject({
      status: 409,
    } satisfies Partial<HttpError>)
  })

  it('schedules a reconnection for an unreachable node without erroring', async () => {
    const created = await createTestNode(sdk)
    cleanup.register(() => removeNodeTolerantly(sdk, created.id))

    // reconnectNode's response has no declared schema (NodeModel/ReconnectNode.ts
    // types it `any`) — it's a plain "scheduled" acknowledgement, not a NodeResponse.
    await expect(sdk.node.reconnectNode(created.id)).resolves.not.toThrow()
  })

  it('rejects all node operations from a non-sudo admin session', async () => {
    const { username, password } = await createTestAdmin(sdk)
    cleanup.register(() => removeAdminTolerantly(sdk, username))

    const created = await createTestNode(sdk)
    cleanup.register(() => removeNodeTolerantly(sdk, created.id))

    const nonSudoSdk = await createTestSdk({ username, password })
    try {
      await expect(nonSudoSdk.node.getNodes()).rejects.toMatchObject({ status: 403 } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.node.getNode(created.id)).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.node.getNodeSettings()).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.node.getUsage()).rejects.toMatchObject({ status: 403 } satisfies Partial<HttpError>)
      await expect(createTestNode(nonSudoSdk)).rejects.toMatchObject({ status: 403 } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.node.modifyNode(created.id, { usage_coefficient: 5 })).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.node.reconnectNode(created.id)).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.node.removeNode(created.id)).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
    } finally {
      await nonSudoSdk.destroy()
    }
  })
})
