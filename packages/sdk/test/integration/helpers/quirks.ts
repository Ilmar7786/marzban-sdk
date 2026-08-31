import type { MarzbanSDK } from '../../../src/index'
import { tlsAgent } from './tls'

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
  return { httpsAgent: tlsAgent() }
}

/**
 * `sdk.user.removeUser()` itself now absorbs the panel's 500-despite-success
 * quirk (docs/marzban-quirks.md: "DELETE /api/user/{username} 500s despite
 * deleting the user"), confirming via its own follow-up `getUser` before
 * treating a 500 as success. This wrapper only adds
 * {@link freshConnectionConfig} — a one-off connection, so that internal
 * confirmation (and any later call reusing the pool) doesn't draw the
 * poisoned socket the crash can leave behind. Use this wherever a test needs
 * to actually remove a user (cleanup or the delete test itself).
 */
export async function removeUserTolerantly(sdk: MarzbanSDK, username: string): Promise<void> {
  await sdk.user.removeUser(username, freshConnectionConfig())
}
