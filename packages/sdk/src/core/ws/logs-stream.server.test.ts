import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AnyType } from '@/common'
import { isSdkDestroyedError, isWsError, WsOptionsError } from '@/core/errors'
import { createMarzbanSDK, type MarzbanSDK } from '@/core/MarzbanSDK'
import type { MockPanel } from '@/testing'
import { selectWsTransport, startMockPanel, WS_TRANSPORTS } from '@/testing'

import type { LogStreamTuning } from './log-stream'

/**
 * `LogsStream`/`LogStream` exercised against the real-socket fixture from
 * `src/testing/` — a synchronous fake can't reproduce any of the timing this
 * file exists to pin (an unsolicited `close`, a shutdown overlapping a
 * reconnect, a handshake that never completes).
 *
 * The reconnect state machine's own timing is driven through the internal
 * `tuning` seam rather than fake timers: the fixture is a real `ws.Server` on
 * real sockets, and fake timers would freeze its I/O along with the backoff
 * being tested.
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

  /**
   * Shrinks the reconnect policy's real-world windows (10s connect timeout,
   * 1s-30s backoff, 10min budget) to test scale. `LogsStream` reads `tuning`
   * when a stream is created, so this applies to every later `connect*()`.
   */
  function tune(instance: MarzbanSDK, tuning: Partial<LogStreamTuning>): void {
    ;(instance.logs as AnyType).tuning = tuning
  }

  function trackedStreams(instance: MarzbanSDK): Set<unknown> {
    return (instance.logs as AnyType).activeStreams as Set<unknown>
  }

  // ─── Connection basics ─────────────────────────────────────────────────────

  it('sends the token obtained from login and the requested interval in the handshake', async () => {
    const instance = await connectSdk()

    await instance.logs.connectByCore({ interval: 7, onMessage: () => {} })

    const [handshake] = await panel.waitForHandshakes(1)
    expect(handshake!.pathname).toBe('/api/core/logs')
    expect(handshake!.interval).toBe('7')
    // Only the ws-package transport can send a header — there, the token
    // moves out of the URL entirely; the native transport has no such
    // option, so it always carries it in the query string (issue #89).
    if (transportName === 'ws-package') {
      expect(handshake!.token).toBeNull()
      expect(handshake!.headers.authorization).toBe('Bearer mock-access-token')
    } else {
      expect(handshake!.token).toBe('mock-access-token')
      expect(handshake!.headers.authorization).toBeUndefined()
    }
    expect(panel.logins).toEqual([{ username: 'admin', password: 'secret' }])
  })

  it('delivers server messages to onMessage', async () => {
    const instance = await connectSdk()
    const received: unknown[] = []

    await instance.logs.connectByCore({ onMessage: data => received.push(data) })
    panel.broadcast('log line 1')

    await vi.waitFor(() => expect(received).toEqual(['log line 1']))
  })

  it('resolves only once the socket is genuinely open, not merely constructed', async () => {
    const instance = await connectSdk()

    await instance.logs.connectByCore({ onMessage: () => {} })

    // Already open by the time connect() resolved — no waiting needed.
    expect(panel.sockets.size).toBe(1)
  })

  it('closes the specific server socket when the returned close handle is called', async () => {
    const instance = await connectSdk()

    const close = await instance.logs.connectByCore({ onMessage: () => {} })
    const [socket] = await panel.waitForConnections(1)
    close()

    await vi.waitFor(() => expect(socket!.readyState).toBe(socket!.CLOSED))
  })

  it('a fresh login flows through to the next connection', async () => {
    const instance = await connectSdk()

    await instance.logs.connectByCore({ onMessage: () => {} })

    panel.setLogin({ mode: 'ok', token: 'second-token' })
    await instance.authorize()
    await instance.logs.connectByCore({ onMessage: () => {} })

    const handshakes = await panel.waitForHandshakes(2)
    if (transportName === 'ws-package') {
      expect(handshakes[1]?.token).toBeNull()
      expect(handshakes[1]?.headers.authorization).toBe('Bearer second-token')
    } else {
      expect(handshakes[1]?.token).toBe('second-token')
    }
  })

  it('rejects an out-of-range interval before opening a socket (issue #87)', async () => {
    const instance = await connectSdk()

    await expect(instance.logs.connectByCore({ interval: 11, onMessage: () => {} })).rejects.toBeInstanceOf(
      WsOptionsError
    )

    expect(panel.handshakes).toEqual([])
    expect(trackedStreams(instance).size).toBe(0)
  })

  // ─── First connect: fails loudly, never silently (issue #88) ───────────────

  it('rejects with a WsError when the handshake is rejected, after one retry with a fresh token', async () => {
    const instance = await connectSdk()
    panel.setHandshake({ mode: 'reject', status: 403 })

    const onError = vi.fn()
    const connecting = instance.logs.connectByCore({ onMessage: () => {}, onError })

    await expect(connecting).rejects.toSatisfy(isWsError)
    // The failure is reported once, through the promise — never also through
    // onError, which would make a caller handle the same failure twice.
    expect(onError).not.toHaveBeenCalled()
    expect(trackedStreams(instance).size).toBe(0)
    // Two handshakes: the original, then one retry with a freshly issued token.
    expect(panel.handshakes).toHaveLength(2)
    expect(panel.logins).toHaveLength(2)
  })

  it('rejects with a WsError when the panel is unreachable', async () => {
    const instance = await connectSdk()
    // The token is already cached, so this reaches socket construction without
    // needing the panel up.
    await panel.stop()

    const onError = vi.fn()

    await expect(instance.logs.connectByCore({ onMessage: () => {}, onError })).rejects.toSatisfy(isWsError)
    expect(onError).not.toHaveBeenCalled()
    expect(trackedStreams(instance).size).toBe(0)
  })

  it('closes a socket stuck in CONNECTING once the connect timeout elapses, and rejects', async () => {
    const instance = await connectSdk()
    tune(instance, { connectTimeoutMs: 150 })
    panel.setHandshake({ mode: 'hang' })

    await expect(instance.logs.connectByCore({ onMessage: () => {} })).rejects.toSatisfy(isWsError)

    expect(trackedStreams(instance).size).toBe(0)
    // Never upgraded, so it was never a live WebSocket on the server side.
    expect(panel.sockets.size).toBe(0)
  })

  it('carries the rejected handshake phase and a redacted url on the WsError', async () => {
    const instance = await connectSdk()
    panel.setHandshake({ mode: 'reject', status: 403 })

    const error = await instance.logs.connectByCore({ onMessage: () => {} }).catch((err: unknown) => err)

    expect(isWsError(error) && error.phase).toBe('handshake')
    expect(isWsError(error) && error.attempt).toBe(2)
    // Transport-agnostic invariant: the token is never in the URL, whether
    // that's because it was redacted (native — it was there, in the query)
    // or because it was never put there in the first place (ws-package — it
    // went out as a header instead).
    expect(isWsError(error) && error.url).not.toContain('mock-access-token')
    if (transportName === 'native') {
      expect(isWsError(error) && error.url).toContain('token=REDACTED')
    }
  })

  // ─── Reconnect after a transport drop (issue #88's headline case) ──────────

  it('reconnects and keeps delivering messages after the transport drops mid-stream', async () => {
    const instance = await connectSdk()
    tune(instance, { backoffBaseMs: 10, backoffMaxMs: 20 })
    const received: unknown[] = []

    await instance.logs.connectByCore({ onMessage: data => received.push(data) })
    panel.broadcast('before the drop')
    await vi.waitFor(() => expect(received).toEqual(['before the drop']))

    panel.dropAll()

    // A brand new socket reaches the panel without the caller doing anything.
    await panel.waitForConnections(2)
    await vi.waitFor(() => expect(panel.sockets.size).toBe(1))

    panel.broadcast('after the reconnect')
    await vi.waitFor(() => expect(received).toContain('after the reconnect'))
  })

  it('keeps retrying while the panel is briefly unavailable, then reconnects', async () => {
    const instance = await connectSdk()
    tune(instance, { backoffBaseMs: 10, backoffMaxMs: 20, connectTimeoutMs: 60 })
    const received: unknown[] = []

    await instance.logs.connectByCore({ onMessage: data => received.push(data) })

    // Stands in for a restarting panel: the upgrade never completes, on
    // either transport. Deliberately not `reject` — that reports an HTTP
    // status on the `ws` transport, which means "the panel refused this
    // client" and is terminal by design (see the next test).
    panel.setHandshake({ mode: 'hang' })
    panel.dropAll()
    await vi.waitFor(() => expect(panel.handshakes.length).toBeGreaterThanOrEqual(3), { timeout: 5000 })

    panel.setHandshake({ mode: 'accept' })

    await vi.waitFor(() => expect(panel.sockets.size).toBe(1), { timeout: 5000 })
    panel.broadcast('back online')
    await vi.waitFor(() => expect(received).toContain('back online'))
  })

  it('spaces reconnect attempts out instead of hammering the panel', async () => {
    const instance = await connectSdk()
    tune(instance, { backoffBaseMs: 80, backoffMaxMs: 400, connectTimeoutMs: 50 })

    await instance.logs.connectByCore({ onMessage: () => {} })

    panel.setHandshake({ mode: 'hang' })
    const startedAt = Date.now()
    panel.dropAll()

    await vi.waitFor(() => expect(panel.handshakes.length).toBeGreaterThanOrEqual(4), { timeout: 5000 })
    const elapsed = Date.now() - startedAt

    // Without backoff the same attempts would land inside a few milliseconds
    // (the bug this replaces produced 4 logins in 47ms).
    expect(elapsed).toBeGreaterThan(80)
  })

  it('gives up once the reconnect budget is exhausted, reporting through onError', async () => {
    const instance = await connectSdk()
    tune(instance, { backoffBaseMs: 10, backoffMaxMs: 20, connectTimeoutMs: 40, reconnectBudgetMs: 150 })
    const onError = vi.fn()

    await instance.logs.connectByCore({ onMessage: () => {}, onError })

    panel.setHandshake({ mode: 'hang' })
    panel.dropAll()

    // The promise resolved long ago, so a terminal failure can only surface
    // through onError.
    await vi.waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 5000 })
    await vi.waitFor(() => expect(trackedStreams(instance).size).toBe(0))
  })

  it('stops reconnecting when the panel refuses a freshly authenticated handshake', async () => {
    const instance = await connectSdk()
    tune(instance, { backoffBaseMs: 10, backoffMaxMs: 20, reconnectBudgetMs: 60_000 })
    const onError = vi.fn()

    await instance.logs.connectByCore({ onMessage: () => {}, onError })

    // A reported status is the only positive evidence the panel refused this
    // client (a revoked or non-sudo admin), so retrying it with a token we
    // just refreshed can't help — the stream ends instead of spending the
    // whole budget on logins. Only the `ws` transport reports that status;
    // the native one can't, so there it keeps retrying within the budget.
    panel.setHandshake({ mode: 'reject', status: 403 })
    panel.dropAll()

    if (transportName === 'ws-package') {
      await vi.waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 5000 })
      await vi.waitFor(() => expect(trackedStreams(instance).size).toBe(0))
      // Two attempts for the one reconnect (the original plus its re-auth
      // retry), not an attempt per second for ten minutes.
      expect(panel.logins.length).toBeLessThanOrEqual(3)
    } else {
      await vi.waitFor(() => expect(panel.handshakes.length).toBeGreaterThanOrEqual(6), { timeout: 5000 })
      expect(onError).not.toHaveBeenCalled()
    }
  })

  // ─── Shutdown never races a reconnect (issue #84's WS half) ────────────────

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

  it('connectByCore() rejects with SdkDestroyedError once destroy() has resolved (#84)', async () => {
    const instance = await connectSdk()

    await instance.destroy()

    await expect(instance.logs.connectByCore({ onMessage: () => {} })).rejects.toSatisfy(isSdkDestroyedError)
    expect(panel.sockets.size).toBe(0)
  })

  it('destroy() during an in-flight re-auth opens no further sockets', async () => {
    const instance = await connectSdk()
    // Force the re-auth branch, then stall the login so destroy() lands while
    // the stream is parked on that await.
    panel.setHandshake({ mode: 'reject', status: 403 })
    panel.setLogin({ mode: 'stall' })

    const connecting = instance.logs.connectByCore({ onMessage: () => {} })
    await panel.waitForHandshakes(1)
    await vi.waitFor(() => expect(panel.logins.length).toBe(2))

    await instance.destroy()
    const handshakesAtDestroy = panel.handshakes.length

    panel.releaseLogin()
    await expect(connecting).rejects.toSatisfy(isSdkDestroyedError)

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(panel.handshakes).toHaveLength(handshakesAtDestroy)
    expect(panel.sockets.size).toBe(0)
  })

  it('destroy() during a reconnect backoff opens no further sockets', async () => {
    const instance = await connectSdk()
    tune(instance, { backoffBaseMs: 300, backoffMaxMs: 400 })

    await instance.logs.connectByCore({ onMessage: () => {} })
    panel.dropAll()

    // Lands while the reconnect is parked on its backoff sleep.
    await instance.destroy()
    const handshakesAtDestroy = panel.handshakes.length

    await new Promise(resolve => setTimeout(resolve, 500))
    expect(panel.handshakes).toHaveLength(handshakesAtDestroy)
    expect(panel.sockets.size).toBe(0)
  })

  it('the per-stream close handle during a reconnect leaves no orphan socket and stops delivery', async () => {
    const instance = await connectSdk()
    tune(instance, { backoffBaseMs: 250, backoffMaxMs: 300 })
    const received: unknown[] = []

    const close = await instance.logs.connectByCore({ onMessage: data => received.push(data) })
    panel.dropAll()

    // Closes while the replacement socket has not been created yet — the bug
    // this replaces closed the already-dead socket and let the replacement
    // live on, still delivering to a disposed handler.
    close()
    const handshakesAtClose = panel.handshakes.length

    await new Promise(resolve => setTimeout(resolve, 450))
    expect(panel.handshakes).toHaveLength(handshakesAtClose)
    expect(panel.sockets.size).toBe(0)

    panel.broadcast('must not arrive')
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(received).toEqual([])
    expect(trackedStreams(instance).size).toBe(0)
  })

  it('closeAllConnections() during a reconnect opens no further sockets', async () => {
    const instance = await connectSdk()
    tune(instance, { backoffBaseMs: 250, backoffMaxMs: 300 })

    await instance.logs.connectByCore({ onMessage: () => {} })
    panel.dropAll()

    // Not destroy(): the SDK stays alive, so only the stream's own closed flag
    // can stop the reconnect already in flight.
    instance.logs.closeAllConnections()
    const handshakesAtClose = panel.handshakes.length

    await new Promise(resolve => setTimeout(resolve, 450))
    expect(panel.handshakes).toHaveLength(handshakesAtClose)
    expect(panel.sockets.size).toBe(0)
    expect(trackedStreams(instance).size).toBe(0)
  })

  it('closeAllConnections() closes every stream and clears the set even when one close() throws (issue #87)', async () => {
    const instance = await connectSdk()

    await instance.logs.connectByCore({ onMessage: () => {} })
    await instance.logs.connectByNode('node-1', { onMessage: () => {} })
    const sockets = await panel.waitForConnections(2)

    const [sabotaged] = trackedStreams(instance) as Set<{ close: () => void }>
    sabotaged!.close = () => {
      throw new Error('close failed')
    }

    expect(() => instance.logs.closeAllConnections()).not.toThrow()
    expect(trackedStreams(instance).size).toBe(0)

    // The sabotaged stream never really closed its socket, but the other one
    // must have — a partial cleanup must not look like a full one.
    await vi.waitFor(() => {
      const closedCount = sockets.filter(socket => socket.readyState === socket.CLOSED).length
      expect(closedCount).toBe(1)
    })
  })

  // ─── Consumer callbacks can't take the process down (issue #87) ────────────

  it('a throwing onMessage is logged, not thrown, and does not block later messages', async () => {
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

      panel.broadcast('line 1')
      panel.broadcast('line 2')

      await vi.waitFor(() => expect(received).toEqual(['line 1', 'line 2']))
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(unhandledRejections).toEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandledRejection)
    }
  })

  it('a throwing onError is logged, not thrown, and never produces an unhandled rejection', async () => {
    const instance = await connectSdk()
    tune(instance, { backoffBaseMs: 10, backoffMaxMs: 20, connectTimeoutMs: 40, reconnectBudgetMs: 150 })
    const unhandledRejections: unknown[] = []
    const onUnhandledRejection = (reason: unknown) => unhandledRejections.push(reason)
    process.on('unhandledRejection', onUnhandledRejection)

    try {
      const onError = vi.fn(() => {
        throw new Error('onError boom')
      })
      await instance.logs.connectByCore({ onMessage: () => {}, onError })

      panel.setHandshake({ mode: 'hang' })
      panel.dropAll()

      await vi.waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 5000 })
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(unhandledRejections).toEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandledRejection)
    }
  })
})
