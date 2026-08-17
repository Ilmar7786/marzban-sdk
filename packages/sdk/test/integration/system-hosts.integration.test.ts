import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import type { HttpError, MarzbanSDK, ProxyHost } from '../../src/index'
import { createTestAdmin, removeAdminTolerantly } from './helpers/adminFixture'
import { createCleanupRegistry } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { freshConnectionConfig } from './helpers/quirks'
import { restoreHosts, snapshotHosts } from './helpers/systemFixture'

// `modifyHosts` replaces the whole hosts map, not a patch — every test here
// mutates it and restores from a beforeAll snapshot, with a deep-equal
// assertion in afterAll (see core.integration.test.ts for the same
// pattern and why it matters under fileParallelism: false).
describe('system hosts integration (modifyHosts replace semantics)', () => {
  let sdk: MarzbanSDK
  let hostsSnapshot: Record<string, ProxyHost[]>
  let inboundTag: string
  const cleanup = createCleanupRegistry()

  beforeAll(async () => {
    sdk = await createTestSdk()
    hostsSnapshot = await snapshotHosts(sdk)
    inboundTag = Object.keys(hostsSnapshot)[0]!
  })

  afterAll(async () => {
    await cleanup.runAll()
    await restoreHosts(sdk, hostsSnapshot)
    await expect(sdk.system.getHosts(freshConnectionConfig())).resolves.toEqual(hostsSnapshot)
    await sdk.destroy()
  })

  it('round-trips getHosts through modifyHosts without losing fields', async () => {
    const applied = await sdk.system.modifyHosts(hostsSnapshot)

    expect(applied).toEqual(hostsSnapshot)
    await expect(sdk.system.getHosts()).resolves.toEqual(hostsSnapshot)

    await restoreHosts(sdk, hostsSnapshot)
  })

  it('applies a host change and reflects it on the next read', async () => {
    const changed = {
      ...hostsSnapshot,
      [inboundTag]: hostsSnapshot[inboundTag]!.map(h => ({
        ...h,
        remark: 'sdk-it-changed',
        port: 8443,
        sni: 'x.test',
      })),
    }

    const applied = await sdk.system.modifyHosts(changed)
    expect(applied[inboundTag]).toMatchObject([{ remark: 'sdk-it-changed', port: 8443, sni: 'x.test' }])

    const fetched = await sdk.system.getHosts()
    expect(fetched[inboundTag]).toMatchObject([{ remark: 'sdk-it-changed', port: 8443, sni: 'x.test' }])

    await restoreHosts(sdk, hostsSnapshot)
    await expect(sdk.system.getHosts()).resolves.toEqual(hostsSnapshot)
  })

  it('clears hosts for a tag passed with an empty array', async () => {
    const cleared = { ...hostsSnapshot, [inboundTag]: [] }

    const applied = await sdk.system.modifyHosts(cleared)
    expect(applied[inboundTag]).toEqual([])
    await expect(sdk.system.getHosts()).resolves.toMatchObject({ [inboundTag]: [] })

    await restoreHosts(sdk, hostsSnapshot)
    await expect(sdk.system.getHosts()).resolves.toEqual(hostsSnapshot)
  })

  it('leaves every tag untouched when given an empty map (docs/marzban-quirks.md: modifyHosts merges by tag, it does not replace the whole map)', async () => {
    // The docs describe modifyHosts as replacing "the existing config", which
    // reads as whole-map replace. Verified against the live panel: a tag
    // omitted from the payload is left alone — only tags present in the
    // payload are touched. An empty map is therefore a no-op, not a wipe.
    const applied = await sdk.system.modifyHosts({})

    expect(applied).toEqual(hostsSnapshot)
    await expect(sdk.system.getHosts()).resolves.toEqual(hostsSnapshot)
  })

  it('rejects modifying an unknown inbound tag and leaves hosts unchanged', async () => {
    // Verified against the live panel: an unknown tag rejects with 400
    // "Inbound <tag> doesn't exist" and the write never lands.
    await expect(sdk.system.modifyHosts({ 'sdk-it-no-such-inbound': [] })).rejects.toMatchObject({
      status: 400,
    } satisfies Partial<HttpError>)

    await expect(sdk.system.getHosts()).resolves.toEqual(hostsSnapshot)
  })

  it('rejects an invalid security value on the client, before the request is sent', async () => {
    // apps/docs/content/docs/modules/system.mdx's modifyHosts example uses
    // security: 'reality', which ProxyHostSecurity does not allow
    // ('inbound_default' | 'none' | 'tls'). modifyHostsMutationRequestSchema
    // parses the payload client-side before it reaches the panel, so this
    // never becomes an HTTP call.
    const invalid = {
      [inboundTag]: [{ remark: 'x', address: 'x', security: 'reality' }],
    }

    await expect(sdk.system.modifyHosts(invalid as unknown as Record<string, ProxyHost[]>)).rejects.toBeInstanceOf(
      ZodError
    )
    await expect(sdk.system.getHosts()).resolves.toEqual(hostsSnapshot)
  })

  it('rejects a host missing required remark/address on the client, before the request is sent', async () => {
    const invalid = { [inboundTag]: [{}] }

    await expect(sdk.system.modifyHosts(invalid as unknown as Record<string, ProxyHost[]>)).rejects.toBeInstanceOf(
      ZodError
    )
    await expect(sdk.system.getHosts()).resolves.toEqual(hostsSnapshot)
  })

  it('strips unknown host fields before sending, rather than forwarding them', async () => {
    const withUnknownField = {
      ...hostsSnapshot,
      [inboundTag]: hostsSnapshot[inboundTag]!.map(h => ({ ...h, sdkItUnknownField: 'should not survive' })),
    }

    const applied = await sdk.system.modifyHosts(withUnknownField as unknown as Record<string, ProxyHost[]>)
    expect(applied[inboundTag]![0]).not.toHaveProperty('sdkItUnknownField')

    const fetched = await sdk.system.getHosts()
    expect(fetched[inboundTag]![0]).not.toHaveProperty('sdkItUnknownField')

    await restoreHosts(sdk, hostsSnapshot)
  })

  it('rejects reading and writing hosts from a non-sudo admin session', async () => {
    const { username, password } = await createTestAdmin(sdk)
    cleanup.register(() => removeAdminTolerantly(sdk, username))

    const nonSudoSdk = await createTestSdk({ username, password })
    try {
      await expect(nonSudoSdk.system.getHosts()).rejects.toMatchObject({ status: 403 } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.system.modifyHosts(hostsSnapshot)).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
    } finally {
      await nonSudoSdk.destroy()
    }
  })
})
