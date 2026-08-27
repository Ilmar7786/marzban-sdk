import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { MarzbanSDK } from '../../src/index'
import { WsOptionsError } from '../../src/index'
import { createTestSdk } from './helpers/client'

// The only smoke coverage of the WS module against a real panel — the
// detailed timing/race scenarios (reconnect, connect-timeout, shutdown
// races) live on the `src/testing/mock-panel.ts` fixture instead (see
// issue #85); a real panel gives no way to force those deterministically.
describe('logs integration (WebSocket log streaming)', () => {
  let sdk: MarzbanSDK

  beforeAll(async () => {
    sdk = await createTestSdk()
  })

  afterAll(async () => {
    await sdk.destroy()
  })

  it('streams core log lines and closes without invoking onError', async () => {
    const messages: unknown[] = []
    const errors: unknown[] = []

    const close = await sdk.logs.connectByCore({
      onMessage: data => messages.push(data),
      onError: err => errors.push(err),
    })

    // restartCore reliably produces log output on a freshly-subscribed
    // stream — the panel logs its own startup sequence.
    await sdk.core.restartCore()

    await expect.poll(() => messages.length, { timeout: 15_000, interval: 250 }).toBeGreaterThan(0)

    close()

    expect(errors).toEqual([])
  })

  it('rejects an interval > 10 client-side, without ever reaching the panel', async () => {
    // Marzban authorizes before websocket.accept() and rejects interval > 10
    // with a close uvicorn collapses into a generic HTTP 403 (see
    // docs/marzban-quirks.md) — LogsStream now validates interval itself, so
    // this never round-trips to the panel at all.
    await expect(sdk.logs.connectByCore({ interval: 11, onMessage: () => {} })).rejects.toBeInstanceOf(WsOptionsError)
  })
})
