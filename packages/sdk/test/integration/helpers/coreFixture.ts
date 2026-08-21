import type { CoreStats, MarzbanSDK } from '../../../src/index'
import { freshConnectionConfig } from './quirks'

/** Snapshot of the panel's live xray core config, taken before any mutating test runs. */
export function snapshotCoreConfig(sdk: MarzbanSDK): Promise<Record<string, unknown>> {
  return sdk.core.getCoreConfig()
}

/**
 * Writes back a previously-{@link snapshotCoreConfig}'d config and waits for
 * the core to come back up. Uses {@link freshConnectionConfig} since a
 * config write restarts Xray — the same class of event as the `removeUser`
 * 500 that poisons a pooled connection (docs/marzban-quirks.md).
 */
export async function restoreCoreConfig(sdk: MarzbanSDK, snapshot: Record<string, unknown>): Promise<void> {
  await sdk.core.modifyCoreConfig(snapshot, freshConnectionConfig())
  await waitForCoreStarted(sdk)
}

/** Polls `getCoreStats` until the core reports `started: true`, or throws after `timeoutMs`. */
export async function waitForCoreStarted(sdk: MarzbanSDK, timeoutMs = 15_000): Promise<CoreStats> {
  const deadline = Date.now() + timeoutMs
  let last: CoreStats
  do {
    last = await sdk.core.getCoreStats(freshConnectionConfig())
    if (last.started) return last
    await new Promise(resolve => setTimeout(resolve, 250))
  } while (Date.now() < deadline)
  throw new Error(`core did not report started within ${timeoutMs}ms (last: ${JSON.stringify(last)})`)
}
