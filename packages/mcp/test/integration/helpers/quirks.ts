import type { MarzbanSDK } from 'marzban-sdk'

import { tlsAgent } from './tls'

// Mirrors packages/sdk/test/integration/helpers/quirks.ts — see
// docs/marzban-quirks.md for the full writeup of what's worked around here.
// sdk.user.removeUser() itself absorbs the 500-despite-success quirk now;
// this wrapper only adds a fresh connection so the internal confirmation
// doesn't draw the poisoned socket the crash can leave behind.

export function freshConnectionConfig(): Record<string, unknown> {
  return { httpsAgent: tlsAgent() }
}

export async function removeUserTolerantly(sdk: MarzbanSDK, username: string): Promise<void> {
  await sdk.user.removeUser(username, freshConnectionConfig())
}
