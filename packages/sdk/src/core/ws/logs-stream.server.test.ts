import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMarzbanSDK, type MarzbanSDK } from '@/core/MarzbanSDK'
import type { MockPanel } from '@/testing'
import { selectWsTransport, startMockPanel, WS_TRANSPORTS } from '@/testing'

/**
 * `LogsStream` exercised against the real-socket fixture from `src/testing/`
 * instead of the synchronous fake in `logs-stream.test.ts` (see that file's
 * header comment). Only asserts invariants expected to survive #86-#88's
 * reconnect rework — no reconnect/retry/timeout scenarios here, those land
 * with the rework that implements them.
 */
describe.each(WS_TRANSPORTS)('LogsStream over the %s transport', transportName => {
  let panel: MockPanel
  let sdk: MarzbanSDK | undefined

  beforeEach(async () => {
    selectWsTransport(transportName)
    panel = await startMockPanel()
  })

  afterEach(async () => {
    await sdk?.destroy()
    await panel.stop()
    vi.unstubAllGlobals()
    sdk = undefined
  })

  async function connectSdk(): Promise<MarzbanSDK> {
    sdk = await createMarzbanSDK({
      baseUrl: panel.baseUrl,
      username: 'admin',
      password: 'secret',
      retries: 0,
      logger: false,
    })
    return sdk
  }

  it('sends the token obtained from login and the requested interval in the handshake', async () => {
    const instance = await connectSdk()

    await instance.logs.connectByCore({ interval: 7, onMessage: () => {} })

    const [handshake] = await panel.waitForHandshakes(1)
    expect(handshake!.pathname).toBe('/api/core/logs')
    expect(handshake!.interval).toBe('7')
    expect(handshake!.token).toBe('mock-access-token')
    expect(panel.logins).toEqual([{ username: 'admin', password: 'secret' }])
  })

  it('delivers server messages to onMessage', async () => {
    const instance = await connectSdk()
    const received: unknown[] = []

    await instance.logs.connectByCore({ onMessage: data => received.push(data) })
    await panel.waitForConnection()
    panel.broadcast('log line 1')

    await vi.waitFor(() => expect(received).toEqual(['log line 1']))
  })

  it('closes the specific server socket when the returned close handle is called', async () => {
    const instance = await connectSdk()

    const close = await instance.logs.connectByCore({ onMessage: () => {} })
    const [socket] = await panel.waitForConnections(1)
    close()

    await vi.waitFor(() => expect(socket!.readyState).toBe(socket!.CLOSED))
  })

  it('destroy() closes every open server socket', async () => {
    const instance = await connectSdk()

    await instance.logs.connectByCore({ onMessage: () => {} })
    await instance.logs.connectByNode('node-1', { onMessage: () => {} })
    const sockets = await panel.waitForConnections(2)

    await instance.destroy()

    await vi.waitFor(() => {
      sockets.forEach(socket => expect(socket.readyState).toBe(socket.CLOSED))
    })
  })

  it('a fresh login flows through to the next connection', async () => {
    const instance = await connectSdk()

    await instance.logs.connectByCore({ onMessage: () => {} })
    await panel.waitForHandshakes(1)

    panel.setLogin({ mode: 'ok', token: 'second-token' })
    await instance.authorize()
    await instance.logs.connectByCore({ onMessage: () => {} })

    const handshakes = await panel.waitForHandshakes(2)
    expect(handshakes[1]?.token).toBe('second-token')
  })
})
