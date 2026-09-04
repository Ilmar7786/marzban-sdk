import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AnyType } from '@/common'
import type { AuthManager } from '@/core/auth'
import { isWsError } from '@/core/errors'
import type { Logger } from '@/core/logger'

import { Lifecycle } from '../lifecycle'
import { WebSocketClient } from './client'
import { LogStream, type LogStreamOptions } from './log-stream'

/**
 * Unit-level companion to `logs-stream.server.test.ts`: the real-socket
 * fixture proves the policy end to end, but it can't deterministically hit
 * the checkpoints that only matter when something lands *between* two awaits
 * (a shutdown mid-handshake, a socket that opens after its stream was
 * closed). Those need a fake socket and injected clock/sleep.
 */
vi.mock('./client', () => ({
  WebSocketClient: { resolve: vi.fn() },
}))

type FakeSocket = {
  on: (event: string, listener: (payload: AnyType) => void) => void
  init: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  emit: (event: string, payload?: AnyType) => void
  listenerCount: (event: string) => number
}

function createFakeSocket(): FakeSocket {
  const handlers = new Map<string, Array<(payload: AnyType) => void>>()

  return {
    on(event, listener) {
      handlers.set(event, [...(handlers.get(event) ?? []), listener])
    },
    init: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    emit(event, payload) {
      handlers.get(event)?.forEach(listener => listener(payload))
    },
    listenerCount: event => handlers.get(event)?.length ?? 0,
  }
}

const resolveMock = WebSocketClient.resolve as unknown as ReturnType<typeof vi.fn>

describe('LogStream', () => {
  let sockets: FakeSocket[]
  let logger: Logger
  let authService: AuthManager
  let lifecycle: Lifecycle
  let onClosed: Mock<() => void>
  let sleep: Mock<(ms: number) => Promise<void>>
  let clock: number

  beforeEach(() => {
    vi.clearAllMocks()
    sockets = []
    clock = 1_000
    lifecycle = new Lifecycle()
    onClosed = vi.fn<() => void>()
    sleep = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined)

    logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger
    authService = {
      waitForCurrentAuth: vi.fn().mockResolvedValue(undefined),
      retryAuth: vi.fn().mockResolvedValue(undefined),
      accessToken: 'token-1',
    } as unknown as AuthManager

    resolveMock.mockImplementation(() => {
      const socket = createFakeSocket()
      sockets.push(socket)
      return socket
    })
  })

  function createStream(overrides: Partial<LogStreamOptions> = {}): LogStream {
    return new LogStream({
      endpoint: '/api/core/logs',
      interval: 1,
      handlers: { onMessage: vi.fn(), onError: vi.fn() },
      basePath: 'https://panel.example.com',
      authService,
      logger,
      lifecycle,
      onClosed,
      ...overrides,
      // Merged last: an override that only sets e.g. backoffBaseMs must not
      // silently drop the fake now/sleep and fall back to real timers.
      tuning: { now: () => clock, sleep, ...overrides.tuning },
    })
  }

  /** Resolves once `resolve()` has produced socket number `index` (i.e. that attempt reached socket construction). */
  async function waitForSocket(index: number): Promise<FakeSocket> {
    await vi.waitFor(() => expect(sockets.length).toBeGreaterThan(index))
    return sockets[index]!
  }

  async function openStream(overrides: Partial<LogStreamOptions> = {}): Promise<LogStream> {
    const stream = createStream(overrides)
    const opening = stream.open()
    ;(await waitForSocket(0)).emit('open')
    await opening
    return stream
  }

  describe('state', () => {
    it('starts connecting, reaches open, and ends closed', async () => {
      const stream = createStream()
      expect(stream.state).toBe('connecting')

      const opening = stream.open()
      ;(await waitForSocket(0)).emit('open')
      await opening
      expect(stream.state).toBe('open')

      stream.close()
      expect(stream.state).toBe('closed')
    })

    it('reports reconnecting between a drop and the next open', async () => {
      const stream = await openStream({ tuning: { backoffBaseMs: 1, backoffMaxMs: 1 } })

      sockets[0]!.emit('close', { code: 1006 })

      expect(stream.state).toBe('reconnecting')
      ;(await waitForSocket(1)).emit('open')
      await vi.waitFor(() => expect(stream.state).toBe('open'))
    })
  })

  describe('shutdown checkpoints', () => {
    it('opens no socket when the SDK is destroyed while authentication is in flight', async () => {
      let releaseAuth: () => void = () => {}
      authService.waitForCurrentAuth = vi.fn(
        () =>
          new Promise<void>(resolve => {
            releaseAuth = resolve
          })
      )

      const stream = createStream()
      const opening = stream.open()

      lifecycle.markDestroyed()
      releaseAuth()

      await expect(opening).rejects.toThrow()
      expect(resolveMock).not.toHaveBeenCalled()
    })

    it('closes a socket that opens after the stream was already closed, and never delivers from it', async () => {
      const onMessage = vi.fn()
      const stream = createStream({ handlers: { onMessage } })
      const opening = stream.open()
      const socket = await waitForSocket(0)

      stream.close()
      socket.emit('open')
      socket.emit('message', { data: 'late line' })

      await opening
      expect(socket.close).toHaveBeenCalled()
      expect(onMessage).not.toHaveBeenCalled()
    })

    it('drops messages from a socket superseded by a newer generation', async () => {
      const onMessage = vi.fn()
      const stream = await openStream({ handlers: { onMessage }, tuning: { backoffBaseMs: 1, backoffMaxMs: 1 } })

      sockets[0]!.emit('close', { code: 1006 })
      await waitForSocket(1)

      // The old socket is still capable of emitting; its data must not reach
      // a consumer that has already been handed a replacement.
      sockets[0]!.emit('message', { data: 'from the dead socket' })

      expect(onMessage).not.toHaveBeenCalled()
      stream.close()
    })

    it('is idempotent: a second close() does nothing', async () => {
      const stream = await openStream()

      stream.close()
      stream.close()

      expect(onClosed).toHaveBeenCalledTimes(1)
    })

    it('logs rather than throws when the underlying close() fails', async () => {
      const stream = await openStream()
      sockets[0]!.close.mockImplementation(() => {
        throw new Error('close failed')
      })

      expect(() => stream.close()).not.toThrow()
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to close WebSocket connection'),
        expect.any(Error),
        'LogsStream'
      )
    })
  })

  describe('authentication', () => {
    it('authenticates before the first attempt when no token is cached', async () => {
      ;(authService as AnyType).accessToken = ''

      const stream = createStream()
      const opening = stream.open()
      ;(await waitForSocket(0)).emit('open')
      await opening

      expect(authService.retryAuth).toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith('No access token available, attempting to re-authenticate', 'LogsStream')
    })

    it('rejects with a WsError when re-authentication fails after a rejected handshake', async () => {
      authService.retryAuth = vi.fn().mockRejectedValue(new Error('login failed'))

      const stream = createStream()
      const opening = stream.open()
      ;(await waitForSocket(0)).emit('error', { message: '' })

      const error = await opening.catch((err: unknown) => err)
      expect(isWsError(error) && error.code).toBe('WS_AUTH_FAILED')
    })
  })

  describe('attempt failures', () => {
    it('treats a rejected init() as a failed attempt', async () => {
      resolveMock.mockImplementationOnce(() => {
        const socket = createFakeSocket()
        socket.init.mockRejectedValue(new Error('ws import failed'))
        sockets.push(socket)
        return socket
      })

      const stream = createStream()
      const opening = stream.open()
      ;(await waitForSocket(1)).emit('error', { message: '' })

      await expect(opening).rejects.toSatisfy(isWsError)
    })

    it('fails the attempt on a bare close, with no error event preceding it', async () => {
      const stream = createStream()
      const settled = stream.open().catch((error: unknown) => error)

      // A server that accepts the TCP connection and then closes it during
      // the handshake reports nothing else — the close alone has to settle
      // the attempt, or it would hang until the connect timeout.
      ;(await waitForSocket(0)).emit('close', { code: 1006 })
      ;(await waitForSocket(1)).emit('close', { code: 1006 })

      const error = await settled
      expect(isWsError(error) && error.closeCode).toBe(1006)
      expect(stream.state).toBe('closed')
    })

    it('ignores the close event that trails an already-reported handshake failure', async () => {
      const stream = createStream()
      const settled = stream.open().catch((error: unknown) => error)

      // Every transport reports one failed handshake as `error` *and* then
      // `close`. Treating that trailing close as a drop would reset the
      // reconnect budget and start a second, parallel reconnect loop.
      const first = await waitForSocket(0)
      first.emit('error', { message: '' })
      first.emit('close', { code: 1006 })

      const second = await waitForSocket(1)
      second.emit('error', { message: '' })
      second.emit('close', { code: 1006 })

      expect(isWsError(await settled)).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 20))
      // Exactly two attempts: the original and its one re-auth retry.
      expect(sockets).toHaveLength(2)
      expect(stream.state).toBe('closed')
    })

    it('succeeds when the retry with a fresh token opens', async () => {
      const stream = createStream()
      const opening = stream.open()

      ;(await waitForSocket(0)).emit('error', { message: '' })
      ;(await waitForSocket(1)).emit('open')

      await opening
      expect(stream.state).toBe('open')
      expect(authService.retryAuth).toHaveBeenCalledTimes(1)
    })

    it('reports a failed attempt once when init() rejects after an error already settled it', async () => {
      let rejectInit: (error: Error) => void = () => {}
      resolveMock.mockImplementationOnce(() => {
        const socket = createFakeSocket()
        socket.init.mockReturnValue(
          new Promise((_, reject) => {
            rejectInit = reject
          })
        )
        sockets.push(socket)
        return socket
      })

      const stream = createStream()
      const opening = stream.open()
      const first = await waitForSocket(0)

      first.emit('error', { message: '' })
      // The rejection lands after the error already settled this attempt —
      // it must not settle it a second time with different information.
      rejectInit(new Error('ws import failed'))

      ;(await waitForSocket(1)).emit('open')
      await opening
      expect(stream.state).toBe('open')
    })

    it('ignores an open that arrives after the connect timeout already gave up', async () => {
      const onMessage = vi.fn()
      const stream = createStream({ handlers: { onMessage }, tuning: { connectTimeoutMs: 10 } })
      const settled = stream.open().catch((error: unknown) => error)

      const first = await waitForSocket(0)
      await vi.waitFor(() => expect(first.close).toHaveBeenCalled())

      // The handshake completes late, after its socket was written off. It
      // must not revive an attempt that already reported failure.
      first.emit('open')
      first.emit('message', { data: 'from a socket we gave up on' })

      expect(isWsError(await settled)).toBe(true)
      expect(onMessage).not.toHaveBeenCalled()
    })

    it('closes the socket and fails the attempt when the handshake times out', async () => {
      const stream = createStream({ tuning: { connectTimeoutMs: 20 } })
      // Attached before anything can settle, so the terminal rejection is
      // never momentarily unhandled.
      const settled = stream.open().catch((error: unknown) => error)
      const socket = await waitForSocket(0)

      // Neither attempt ever answers: the timeout is the only thing that
      // settles them, and the second one is terminal.
      const error = await settled

      expect(socket.close).toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('handshake timed out'), 'LogsStream')
      expect(isWsError(error)).toBe(true)
    })
  })

  describe('reconnect policy', () => {
    async function reconnectOnce(stream: LogStream): Promise<void> {
      sockets[0]!.emit('close', { code: 1006 })
      ;(await waitForSocket(1)).emit('open')
      await vi.waitFor(() => expect(stream.state).toBe('open'))
    }

    it('closes the replacement socket when the stream is closed as the reconnect succeeds', async () => {
      let releaseSleep: () => void = () => {}
      const stream = await openStream({
        tuning: {
          sleep: () =>
            new Promise<void>(resolve => {
              releaseSleep = resolve
            }),
        },
      })

      sockets[0]!.emit('close', { code: 1006 })
      releaseSleep()

      const replacement = await waitForSocket(1)
      stream.close()
      replacement.emit('open')

      await vi.waitFor(() => expect(replacement.close).toHaveBeenCalled())
      expect(stream.state).toBe('closed')
    })

    it('keeps one budget across a flapping connection instead of granting a fresh one per drop', async () => {
      const stream = await openStream({
        tuning: { backoffBaseMs: 1, backoffMaxMs: 1, stableAfterMs: 60_000, reconnectBudgetMs: 5_000 },
      })

      sockets[0]!.emit('close', { code: 1006 })
      const deadlineAfterFirstDrop = (stream as AnyType).budgetDeadline
      ;(await waitForSocket(1)).emit('open')
      await vi.waitFor(() => expect(stream.state).toBe('open'))

      // Drops again before it was ever stable: the clock keeps running on the
      // original budget, so a permanently flapping stream still gives up.
      clock += 1_000
      sockets[1]!.emit('close', { code: 1006 })

      expect((stream as AnyType).budgetDeadline).toBe(deadlineAfterFirstDrop)
      stream.close()
    })

    it('ignores a stability timer belonging to a superseded connection', async () => {
      // Long enough that the timer provably has not fired before the second
      // drop supersedes the connection that armed it.
      const stream = await openStream({
        tuning: { backoffBaseMs: 1, backoffMaxMs: 1, stableAfterMs: 300, reconnectBudgetMs: 60_000 },
      })

      // Arm a stability timer, then drop again before it fires: when it does
      // fire it belongs to a generation that is no longer current.
      sockets[0]!.emit('close', { code: 1006 })
      ;(await waitForSocket(1)).emit('open')
      await vi.waitFor(() => expect(stream.state).toBe('open'))

      sockets[1]!.emit('close', { code: 1006 })
      await waitForSocket(2)
      await new Promise(resolve => setTimeout(resolve, 400))

      // The stale timer left the live reconnect's bookkeeping alone.
      expect((stream as AnyType).reconnectAttempt).toBeGreaterThan(0)
      expect((stream as AnyType).budgetDeadline).toBeDefined()
      stream.close()
    })

    it('resets the backoff and budget once a reconnected stream has been stable', async () => {
      const stream = await openStream({
        tuning: { backoffBaseMs: 1, backoffMaxMs: 1, stableAfterMs: 150, reconnectBudgetMs: 60_000 },
      })

      await reconnectOnce(stream)
      expect((stream as AnyType).reconnectAttempt).toBe(1)

      // Budget cleared: a later drop gets the full window again rather than
      // inheriting a deadline set before the stream recovered.
      await vi.waitFor(() => {
        expect((stream as AnyType).reconnectAttempt).toBe(0)
        expect((stream as AnyType).budgetDeadline).toBeUndefined()
      })
    })

    it('does not reset anything when the stability timer fires after the stream was closed', async () => {
      const stream = await openStream({ tuning: { backoffBaseMs: 1, backoffMaxMs: 1, stableAfterMs: 150 } })

      await reconnectOnce(stream)
      stream.close()

      await new Promise(resolve => setTimeout(resolve, 200))
      expect(stream.state).toBe('closed')
      // The timer fired against a closed stream and left its bookkeeping alone.
      expect((stream as AnyType).reconnectAttempt).toBe(1)
    })

    it('reports a synthesized error to onError when the budget expires with no event to forward', async () => {
      const onError = vi.fn()
      const stream = createStream({
        handlers: { onMessage: vi.fn(), onError },
        tuning: { backoffBaseMs: 1, backoffMaxMs: 1, reconnectBudgetMs: 0 },
      })

      const opening = stream.open()
      ;(await waitForSocket(0)).emit('open')
      await opening

      // A close with no event payload at all — the terminal report still has
      // to be a well-formed WsError even with nothing to forward.
      sockets[0]!.emit('close', undefined)

      await vi.waitFor(() => expect(onError).toHaveBeenCalled())
      const error = onError.mock.calls[0]![0]
      expect(isWsError(error) && error.code).toBe('WS_RETRIES_EXHAUSTED')
      expect(isWsError(error) && error.phase).toBe('connection')
      expect(isWsError(error) && error.details?.event).toBeUndefined()
      expect(stream.state).toBe('closed')
    })

    it('stops the reconnect loop when the stream is closed during the backoff sleep', async () => {
      let releaseSleep: () => void = () => {}
      const stream = createStream({
        tuning: {
          sleep: () =>
            new Promise<void>(resolve => {
              releaseSleep = resolve
            }),
        },
      })

      const opening = stream.open()
      ;(await waitForSocket(0)).emit('open')
      await opening

      sockets[0]!.emit('close', { code: 1006 })
      stream.close()
      releaseSleep()

      await vi.waitFor(() => expect(sockets).toHaveLength(1))
    })
  })

  describe('lifecycle callbacks', () => {
    it('calls onOpen once on the first connect', async () => {
      const onOpen = vi.fn()
      await openStream({ handlers: { onMessage: vi.fn(), onOpen } })

      expect(onOpen).toHaveBeenCalledTimes(1)
    })

    it('calls onOpen again, and onReconnect with the attempt and downtime, on a successful reconnect', async () => {
      const onOpen = vi.fn()
      const onReconnect = vi.fn()
      const stream = await openStream({
        handlers: { onMessage: vi.fn(), onOpen, onReconnect },
        tuning: { backoffBaseMs: 1, backoffMaxMs: 1 },
      })
      onOpen.mockClear()

      sockets[0]!.emit('close', { code: 1006 })
      clock += 5_000
      ;(await waitForSocket(1)).emit('open')
      await vi.waitFor(() => expect(stream.state).toBe('open'))

      expect(onOpen).toHaveBeenCalledTimes(1)
      expect(onReconnect).toHaveBeenCalledExactlyOnceWith({ attempt: 1, downtimeMs: 5_000 })
      // onOpen reports the state transition before onReconnect reports how it got there.
      expect(onOpen.mock.invocationCallOrder[0]).toBeLessThan(onReconnect.mock.invocationCallOrder[0]!)
    })

    it('calls onClose({ byCaller: true }) exactly once when the caller closes an open stream', async () => {
      const onClose = vi.fn()
      const stream = await openStream({ handlers: { onMessage: vi.fn(), onClose } })

      stream.close()
      stream.close()

      expect(onClose).toHaveBeenCalledExactlyOnceWith({ byCaller: true })
    })

    it('never calls onClose for a first connect that fails without ever opening', async () => {
      const onClose = vi.fn()
      const stream = createStream({ handlers: { onMessage: vi.fn(), onClose } })
      const opening = stream.open().catch((error: unknown) => error)

      ;(await waitForSocket(0)).emit('error', { message: '' })
      ;(await waitForSocket(1)).emit('error', { message: '' })

      expect(isWsError(await opening)).toBe(true)
      expect(onClose).not.toHaveBeenCalled()
    })

    it('never calls onClose when destroyed while the handshake is in flight', async () => {
      let releaseAuth: () => void = () => {}
      authService.waitForCurrentAuth = vi.fn(
        () =>
          new Promise<void>(resolve => {
            releaseAuth = resolve
          })
      )
      const onClose = vi.fn()
      const stream = createStream({ handlers: { onMessage: vi.fn(), onClose } })
      const opening = stream.open()

      lifecycle.markDestroyed()
      releaseAuth()

      await expect(opening).rejects.toThrow()
      expect(onClose).not.toHaveBeenCalled()
    })

    it('calls onError then onClose({ byCaller: false }) in order when the stream terminates itself', async () => {
      const onError = vi.fn()
      const onClose = vi.fn()
      const stream = createStream({
        handlers: { onMessage: vi.fn(), onError, onClose },
        tuning: { backoffBaseMs: 1, backoffMaxMs: 1, reconnectBudgetMs: 0 },
      })
      const opening = stream.open()
      ;(await waitForSocket(0)).emit('open')
      await opening

      sockets[0]!.emit('close', { code: 1006 })

      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
      expect(onError).toHaveBeenCalledTimes(1)
      // closeCode carries over from the drop that started this reconnect loop.
      expect(onClose).toHaveBeenCalledExactlyOnceWith({ code: 1006, byCaller: false })
      expect(onError.mock.invocationCallOrder[0]).toBeLessThan(onClose.mock.invocationCallOrder[0]!)
      expect(stream.state).toBe('closed')
    })

    it('logs rather than throws when onOpen throws', async () => {
      const onOpen = vi.fn(() => {
        throw new Error('onOpen boom')
      })
      await openStream({ handlers: { onMessage: vi.fn(), onOpen } })

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('onOpen callback threw'),
        expect.any(Error),
        'LogsStream'
      )
    })

    it('logs rather than throws when onReconnect throws', async () => {
      const onReconnect = vi.fn(() => {
        throw new Error('onReconnect boom')
      })
      const stream = await openStream({
        handlers: { onMessage: vi.fn(), onReconnect },
        tuning: { backoffBaseMs: 1, backoffMaxMs: 1 },
      })

      sockets[0]!.emit('close', { code: 1006 })
      ;(await waitForSocket(1)).emit('open')
      await vi.waitFor(() => expect(stream.state).toBe('open'))

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('onReconnect callback threw'),
        expect.any(Error),
        'LogsStream'
      )
    })

    it('logs rather than throws when onClose throws', async () => {
      const onClose = vi.fn(() => {
        throw new Error('onClose boom')
      })
      const stream = await openStream({ handlers: { onMessage: vi.fn(), onClose } })

      stream.close()

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('onClose callback threw'),
        expect.any(Error),
        'LogsStream'
      )
    })
  })
})
