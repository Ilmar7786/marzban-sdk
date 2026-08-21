import https from 'node:https'

import { isHttpError, type MarzbanSDK } from '../../../src/index'

// Real Marzban panel behavior worked around below — see
// docs/marzban-quirks.md for the full writeup (symptom, root cause,
// verification, open questions) instead of repeating it in comments here.

/**
 * A one-off `httpsAgent` per call, bypassing the SDK's shared connection
 * pool (docs/marzban-quirks.md: "the 500 above can poison the next
 * request on the same connection"). Typed as `Record<string, unknown>`
 * (rather than kubb's own narrowed `RequestConfig`, which doesn't declare
 * `httpsAgent` at all even though the generated methods spread it straight
 * into the underlying `axios.request()` call) so it structurally matches
 * every generated method's `config` parameter without an unsafe cast.
 */
export function freshConnectionConfig(): Record<string, unknown> {
  return { httpsAgent: new https.Agent() }
}

/**
 * `removeUser` reliably rejects with a 500 even when the delete succeeded
 * (docs/marzban-quirks.md: "DELETE /api/user/{username} 500s despite
 * deleting the user"). Use this wherever a test needs to actually remove a
 * user (cleanup or the delete test itself); verify the outcome via a
 * follow-up `getUser` 404 (with {@link freshConnectionConfig}), not via
 * this resolving.
 */
export async function removeUserTolerantly(sdk: MarzbanSDK, username: string): Promise<void> {
  try {
    await sdk.user.removeUser(username, freshConnectionConfig())
  } catch (err) {
    if (isHttpError(err) && err.status === 500) return
    throw err
  }
}
