import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { MarzbanSDK, ProxyHost } from '../../src/index'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { createTestNode, removeNodeTolerantly } from './helpers/nodeFixture'
import { restoreHosts, snapshotHosts } from './helpers/systemFixture'

// The only node test that mutates the panel's live proxy host map
// (addNode's add_as_new_host: true default). A snapshot is taken once in
// beforeAll and restored — with a deep-equal assertion, not just a
// best-effort write — after the suite (see core.integration.test.ts for
// the same pattern and why it matters under fileParallelism: false).
// Everything else about node CRUD lives in node.integration.test.ts, which
// always passes add_as_new_host: false.
describe('node integration (add_as_new_host host map mutation)', () => {
  let sdk: MarzbanSDK
  let hostsSnapshot: Record<string, ProxyHost[]>
  let inboundTag: string
  const cleanup = createCleanupRegistry()

  beforeAll(async () => {
    sdk = await createTestSdk()
    hostsSnapshot = await snapshotHosts(sdk)
    inboundTag = Object.keys(hostsSnapshot)[0]!
  })

  afterEach(async () => {
    await cleanup.runAll()
  })

  afterAll(async () => {
    await restoreHosts(sdk, hostsSnapshot)
    await expect(sdk.system.getHosts()).resolves.toEqual(hostsSnapshot)
    await sdk.destroy()
  })

  it('adds a host entry for the node under its inbound tag, and removeNode does not clean it up', async () => {
    const node = await createTestNode(sdk, { name: uniqueTestName('node-host'), add_as_new_host: true })
    cleanup.register(() => removeNodeTolerantly(sdk, node.id))
    cleanup.register(() => restoreHosts(sdk, hostsSnapshot))

    const hostsAfterAdd = await sdk.system.getHosts()
    const added = (hostsAfterAdd[inboundTag] ?? []).find(h => h.address === node.address)
    expect(added).toBeDefined()
    expect(added!.remark).toContain(node.name)

    // Verified live-panel quirk: removeNode deletes the node row but leaves
    // the host entry it created behind — see docs/marzban-quirks.md.
    await sdk.node.removeNode(node.id)
    const hostsAfterRemove = await sdk.system.getHosts()
    const stillThere = (hostsAfterRemove[inboundTag] ?? []).find(h => h.address === node.address)
    expect(stillThere).toBeDefined()
  })
})
