import { isHttpError, type MarzbanSDK, type NodeCreate, type NodeResponse } from '../../../src/index'
import { uniqueTestName } from './cleanup'

/**
 * Address/port pair that is syntactically valid but has nothing listening —
 * the node reliably settles on `status: 'error'` (`[Errno 111] Connection
 * refused`) rather than ever reaching `connected`, since `local/marzban/`
 * has no `marzban-node` container to actually connect to.
 */
export function createTestNode(
  sdk: MarzbanSDK,
  overrides: Partial<NodeCreate> = {}
): ReturnType<MarzbanSDK['node']['addNode']> {
  return sdk.node.addNode({
    name: uniqueTestName('node'),
    address: '127.0.0.1',
    port: 62050,
    api_port: 62051,
    add_as_new_host: false,
    ...overrides,
  })
}

/**
 * Polls `getNode` until its background connection attempt (fired
 * immediately on `addNode`/`modifyNode`, see docs/marzban-quirks.md) has
 * finished and `status` is no longer `'connecting'`. Needed before any test
 * that itself calls `modifyNode` on a freshly created node — modifying a
 * node while that connection attempt is still in flight races it, and the
 * attempt's failure handler can silently overwrite the modification.
 */
export async function waitForNodeSettled(sdk: MarzbanSDK, nodeId: number, timeoutMs = 15_000): Promise<NodeResponse> {
  const deadline = Date.now() + timeoutMs
  let last: NodeResponse
  do {
    last = await sdk.node.getNode(nodeId)
    if (last.status !== 'connecting') return last
    await new Promise(resolve => setTimeout(resolve, 100))
  } while (Date.now() < deadline)
  throw new Error(`node ${nodeId} did not settle within ${timeoutMs}ms (last: ${JSON.stringify(last)})`)
}

/** `removeNode` counterpart to {@link removeAdminTolerantly} — swallows "already gone", not a known 500 quirk here. */
export async function removeNodeTolerantly(sdk: MarzbanSDK, nodeId: number): Promise<void> {
  try {
    await sdk.node.removeNode(nodeId)
  } catch (err) {
    if (isHttpError(err) && err.status === 404) return
    throw err
  }
}
