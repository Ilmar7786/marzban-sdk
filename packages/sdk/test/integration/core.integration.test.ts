import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { HttpError, MarzbanSDK } from '../../src/index'
import { createTestAdmin, removeAdminTolerantly } from './helpers/adminFixture'
import { createCleanupRegistry } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { restoreCoreConfig, snapshotCoreConfig, waitForCoreStarted } from './helpers/coreFixture'
import { freshConnectionConfig } from './helpers/quirks'

// This file mutates the panel's live xray core config (modifyCoreConfig,
// restartCore both restart Xray). A snapshot is taken once in beforeAll and
// restored — with a deep-equal assertion, not just a best-effort write —
// after every test that touches it, so a failure here can't silently break
// the files that run after this one (vitest.integration.config.ts:
// fileParallelism: false).
describe('core integration (stats, config round-trip, restart)', () => {
  let sdk: MarzbanSDK
  let configSnapshot: Record<string, unknown>
  const cleanup = createCleanupRegistry()

  beforeAll(async () => {
    sdk = await createTestSdk()
    configSnapshot = await snapshotCoreConfig(sdk)
  })

  afterEach(async () => {
    await cleanup.runAll()
  })

  afterAll(async () => {
    await restoreCoreConfig(sdk, configSnapshot)
    await expect(sdk.core.getCoreConfig(freshConnectionConfig())).resolves.toEqual(configSnapshot)
    await sdk.destroy()
  })

  it('returns version, started flag, and the core logs websocket path from getCoreStats', async () => {
    const stats = await sdk.core.getCoreStats()

    expect(stats.started).toBe(true)
    expect(stats.version).toEqual(expect.any(String))
    expect(stats.logs_websocket.startsWith('/')).toBe(true)
  })

  it('returns the full xray config tree from getCoreConfig, not an empty object', async () => {
    // ADR-0003 patches getCoreConfig's schema with additionalProperties:
    // true so open-ended Xray config keys survive the zod parse.
    // gen-regression.test.ts pins this at the schema level; this proves it
    // live, against what the panel actually stores.
    const config = await sdk.core.getCoreConfig()

    expect(config).toHaveProperty('log')
    expect(config).toHaveProperty('routing')
    expect(config).toHaveProperty('outbounds')
    expect(Array.isArray(config.inbounds)).toBe(true)
    expect((config.inbounds as unknown[]).length).toBeGreaterThan(0)
  })

  it('round-trips getCoreConfig through modifyCoreConfig without losing keys', async () => {
    const before = await sdk.core.getCoreConfig()

    const applied = await sdk.core.modifyCoreConfig(before, freshConnectionConfig())
    await waitForCoreStarted(sdk)

    expect(applied).toEqual(before)
    await expect(sdk.core.getCoreConfig(freshConnectionConfig())).resolves.toEqual(before)
  })

  it('applies a real config change and reflects it on the next read', async () => {
    const before = await sdk.core.getCoreConfig()
    const changed = { ...before, log: { ...(before.log as object), loglevel: 'debug' } }

    const applied = await sdk.core.modifyCoreConfig(changed, freshConnectionConfig())
    await waitForCoreStarted(sdk)
    expect(applied).toMatchObject({ log: { loglevel: 'debug' } })

    const fetched = await sdk.core.getCoreConfig(freshConnectionConfig())
    expect(fetched).toMatchObject({ log: { loglevel: 'debug' } })

    await sdk.core.modifyCoreConfig(before, freshConnectionConfig())
    await waitForCoreStarted(sdk)
    await expect(sdk.core.getCoreConfig(freshConnectionConfig())).resolves.toEqual(before)
  })

  it('leaves the core started after writing a config (restart completes synchronously enough to poll)', async () => {
    const before = await sdk.core.getCoreConfig()

    await sdk.core.modifyCoreConfig(before, freshConnectionConfig())
    const stats = await waitForCoreStarted(sdk)

    expect(stats.started).toBe(true)
  })

  it('rejects a structurally invalid core config and leaves the stored config unchanged', async () => {
    const before = await sdk.core.getCoreConfig()

    // Verified against the live panel: an empty config rejects with 400
    // "config doesn't have inbounds" — the write never lands (see the
    // follow-up GET below), unlike the removeUser 500 quirk where the
    // mutation succeeds despite the error response.
    await expect(sdk.core.modifyCoreConfig({}, freshConnectionConfig())).rejects.toMatchObject({
      status: 400,
    } satisfies Partial<HttpError>)

    await expect(sdk.core.getCoreConfig(freshConnectionConfig())).resolves.toEqual(before)
  })

  it('restarts the core and brings it back up', async () => {
    const before = await sdk.core.getCoreConfig()
    const beforeStats = await sdk.core.getCoreStats()

    await sdk.core.restartCore(freshConnectionConfig())
    const stats = await waitForCoreStarted(sdk)

    expect(stats.started).toBe(true)
    expect(stats.version).toBe(beforeStats.version)
    await expect(sdk.core.getCoreConfig(freshConnectionConfig())).resolves.toEqual(before)
  })

  it('rejects reading/writing core config and restarting from a non-sudo admin session', async () => {
    const { username, password } = await createTestAdmin(sdk)
    cleanup.register(() => removeAdminTolerantly(sdk, username))

    const nonSudoSdk = await createTestSdk({ username, password })
    try {
      await expect(nonSudoSdk.core.getCoreConfig()).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.core.modifyCoreConfig({})).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.core.restartCore()).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
      // coreApi.ts's getCoreStats error union only declares 401 — characterize
      // whether a non-sudo (but authenticated) admin can actually read it.
      await expect(nonSudoSdk.core.getCoreStats()).resolves.toMatchObject({ started: true })
    } finally {
      await nonSudoSdk.destroy()
    }
  })
})
