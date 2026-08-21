import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { MarzbanSDK } from '../../src/index'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { SHADOWSOCKS_PROXY } from './helpers/fixtures'
import { freshConnectionConfig, removeUserTolerantly } from './helpers/quirks'

// Read-only against system/core state — no snapshot/restore needed here.
// modifyHosts's destructive replace semantics are covered separately in
// system-hosts.integration.test.ts, which owns its own snapshot/restore
// lifecycle.
describe('system integration (stats, inbounds, hosts read)', () => {
  let sdk: MarzbanSDK
  const cleanup = createCleanupRegistry()

  beforeAll(async () => {
    sdk = await createTestSdk()
  })

  afterAll(async () => {
    await cleanup.runAll()
    await sdk.destroy()
  })

  it('returns fully populated system stats', async () => {
    const stats = await sdk.system.getSystemStats()

    expect(stats.version).toEqual(expect.any(String))
    expect(stats.cpu_cores).toBeGreaterThanOrEqual(1)
    expect(stats.cpu_usage).toEqual(expect.any(Number))
    expect(stats.mem_total).toBeGreaterThan(0)
    expect(stats.mem_used).toBeLessThanOrEqual(stats.mem_total)
    expect(stats.total_user).toBeGreaterThanOrEqual(0)
  })

  it('reflects a newly created user in the user counters', async () => {
    const before = await sdk.system.getSystemStats()

    const username = uniqueTestName('system-stats')
    cleanup.register(() => removeUserTolerantly(sdk, username))
    await sdk.user.addUser({ username, status: 'active', proxies: SHADOWSOCKS_PROXY })

    const after = await sdk.system.getSystemStats(freshConnectionConfig())
    expect(after.total_user).toBe(before.total_user + 1)
    expect(after.users_active).toBe(before.users_active + 1)
  })

  it('returns inbounds grouped by protocol, matching the tags in the live core config', async () => {
    const inbounds = await sdk.system.getInbounds()
    const coreConfig = await sdk.core.getCoreConfig()
    const coreInboundTags = (coreConfig.inbounds as Array<{ tag: string }>).map(i => i.tag)

    const allInbounds = Object.values(inbounds).flat()
    expect(allInbounds.length).toBeGreaterThan(0)
    for (const [protocol, entries] of Object.entries(inbounds)) {
      for (const entry of entries) {
        expect(entry.protocol).toBe(protocol)
      }
    }
    expect(allInbounds.map(i => i.tag).sort()).toEqual(coreInboundTags.sort())
  })

  it('returns hosts keyed by inbound tag with schema defaults applied', async () => {
    const inbounds = await sdk.system.getInbounds()
    const inboundTags = Object.values(inbounds)
      .flat()
      .map(i => i.tag)

    const hosts = await sdk.system.getHosts()

    expect(Object.keys(hosts).sort()).toEqual(inboundTags.sort())
    for (const entries of Object.values(hosts)) {
      for (const host of entries) {
        expect(host.remark).toEqual(expect.any(String))
        expect(host.address).toEqual(expect.any(String))
        expect(host.security).toBe('inbound_default')
        expect(host.alpn).toBe('')
        expect(host.fingerprint).toBe('')
        // {USERNAME}/{SERVER_IP}-style tokens are only substituted when a
        // subscription is rendered — sdk.system.getHosts() returns them
        // verbatim.
      }
    }
  })
})
