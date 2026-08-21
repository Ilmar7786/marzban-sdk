import type { MarzbanSDK, ProxyHost } from '../../../src/index'

/** Snapshot of the panel's live proxy hosts, taken before any mutating test runs. */
export function snapshotHosts(sdk: MarzbanSDK): Promise<Record<string, ProxyHost[]>> {
  return sdk.system.getHosts()
}

/** Writes back a previously-{@link snapshotHosts}'d host map (`modifyHosts` replaces the whole map). */
export async function restoreHosts(sdk: MarzbanSDK, snapshot: Record<string, ProxyHost[]>): Promise<void> {
  await sdk.system.modifyHosts(snapshot)
}
