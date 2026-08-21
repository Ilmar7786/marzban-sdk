import { isHttpError, type MarzbanSDK } from 'marzban-sdk'

import { tlsAgent } from './tls'

// Mirrors packages/sdk/test/integration/helpers/quirks.ts — see
// docs/marzban-quirks.md for the full writeup of what's worked around here.

export function freshConnectionConfig(): Record<string, unknown> {
  return { httpsAgent: tlsAgent() }
}

export async function removeUserTolerantly(sdk: MarzbanSDK, username: string): Promise<void> {
  try {
    await sdk.user.removeUser(username, freshConnectionConfig())
  } catch (err) {
    if (isHttpError(err) && err.status === 500) return
    throw err
  }
}
