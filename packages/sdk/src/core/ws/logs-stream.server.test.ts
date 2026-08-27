import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AnyType } from '@/common'
import { WsOptionsError } from '@/core/errors'
import { createMarzbanSDK, type MarzbanSDK } from '@/core/MarzbanSDK'
import type { MockPanel } from '@/testing'
import { selectWsTransport, startMockPanel, WS_TRANSPORTS } from '@/testing'

/**
 * `LogsStream` exercised against the real-socket fixture from `src/testing/`
 * instead of the synchronous fake in `logs-stream.test.ts` (see that file's
 * header comment). Besides the invariants expected to survive #86-#88's
 * reconnect rework, this also carries #86's own regression coverage — a
 * connect that fails (rejected handshake, unreachable host) before it ever
 * opens must still reach `onError` and must not leave a dead entry in
 * `activeConnections`, which requires the real event-loop timing this
 * fixture provides. No reconnect/retry/timeout scenarios beyond that here —
 * those land with the #88 rework.
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

  it('calls onError and leaves no tracked connection when the handshake is rejected (issue #86)', async () => {
    const instance = await connectSdk()
    panel.setHandshake({ mode: 'reject', status: 403 })

    const onError = vi.fn()
    await instance.logs.connectByCore({ onMessage: () => {}, onError })

    await vi.waitFor(() => expect(onError).toHaveBeenCalled())
    expect((instance.logs as AnyType).activeConnections.size).toBe(0)
  })

  it('calls onError and leaves no tracked connection when the panel is unreachable (issue #86)', async () => {
    const instance = await connectSdk()
    // Token is already cached from connectSdk()'s login, so this reaches the
    // socket construction path without needing the panel to be up.
    await panel.stop()

    const onError = vi.fn()
    await instance.logs.connectByCore({ onMessage: () => {}, onError })

    await vi.waitFor(() => expect(onError).toHaveBeenCalled())
    expect((instance.logs as AnyType).activeConnections.size).toBe(0)
  })

  it('untracks the connection once the transport drops mid-stream', async () => {
    const instance = await connectSdk()

    await instance.logs.connectByCore({ onMessage: () => {} })
    await panel.waitForConnection()
    expect((instance.logs as AnyType).activeConnections.size).toBe(1)

    panel.dropAll()

    await vi.waitFor(() => expect((instance.logs as AnyType).activeConnections.size).toBe(0))
  })

  it('rejects an out-of-range interval before opening a socket (issue #87)', async () => {
    const instance = await connectSdk()

    await expect(instance.logs.connectByCore({ interval: 11, onMessage: () => {} })).rejects.toBeInstanceOf(
      WsOptionsError
    )

    expect(panel.handshakes).toEqual([])
    expect((instance.logs as AnyType).activeConnections.size).toBe(0)
  })

  it('a throwing onMessage is logged, not thrown, and does not block later messages (issue #87)', async () => {
    const instance = await connectSdk()
    const received: unknown[] = []
    const unhandledRejections: unknown[] = []
    const onUnhandledRejection = (reason: unknown) => unhandledRejections.push(reason)
    process.on('unhandledRejection', onUnhandledRejection)

    try {
      await instance.logs.connectByCore({
        onMessage: data => {
          received.push(data)
          throw new Error('onMessage boom')
        },
      })
      await panel.waitForConnection()

      panel.broadcast('line 1')
      panel.broadcast('line 2')

      await vi.waitFor(() => expect(received).toEqual(['line 1', 'line 2']))
      // Let a microtask/macrotask turn pass so a would-be unhandled rejection surfaces.
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(unhandledRejections).toEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandledRejection)
    }
  })

  it('a throwing onError is logged, not thrown, and never produces an unhandled rejection (issue #87)', async () => {
    const instance = await connectSdk()
    panel.setHandshake({ mode: 'reject', status: 403 })
    const unhandledRejections: unknown[] = []
    const onUnhandledRejection = (reason: unknown) => unhandledRejections.push(reason)
    process.on('unhandledRejection', onUnhandledRejection)

    try {
      const onError = vi.fn(() => {
        throw new Error('onError boom')
      })
      await instance.logs.connectByCore({ onMessage: () => {}, onError })

      await vi.waitFor(() => expect(onError).toHaveBeenCalled())
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(unhandledRejections).toEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandledRejection)
    }
  })

  it('closeAllConnections() closes every socket and clears the set even when one client throws on close() (issue #87)', async () => {
    const instance = await connectSdk()

    await instance.logs.connectByCore({ onMessage: () => {} })
    await instance.logs.connectByNode('node-1', { onMessage: () => {} })
    const sockets = await panel.waitForConnections(2)

    const activeConnections = (instance.logs as AnyType).activeConnections as Set<{ close: () => void }>
    const [sabotagedClient] = activeConnections
    sabotagedClient!.close = () => {
      throw new Error('close failed')
    }

    expect(() => instance.logs.closeAllConnections()).not.toThrow()
    expect((instance.logs as AnyType).activeConnections.size).toBe(0)

    // The sabotaged client's own close() never really closed its socket, but
    // the other one must have — a partial cleanup must not look like a full one.
    await vi.waitFor(() => {
      const closedCount = sockets.filter(socket => socket.readyState === socket.CLOSED).length
      expect(closedCount).toBe(1)
    })
  })

  it('the returned close handle never throws and still untracks the connection, even if close() itself fails (issue #87)', async () => {
    const instance = await connectSdk()

    const close = await instance.logs.connectByCore({ onMessage: () => {} })
    await panel.waitForConnection()

    const [wsClient] = (instance.logs as AnyType).activeConnections as Set<{ close: () => void }>
    wsClient!.close = () => {
      throw new Error('close failed')
    }

    expect(() => close()).not.toThrow()
    expect((instance.logs as AnyType).activeConnections.size).toBe(0)
  })
})
