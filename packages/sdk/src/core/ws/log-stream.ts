import { AnyType, type HttpAgentLike, redactUrlToken, safeCallback } from '@/common'
import {
  WS_BACKOFF_BASE_MS,
  WS_BACKOFF_MAX_MS,
  WS_CONNECT_TIMEOUT_MS,
  WS_RECONNECT_BUDGET_MS,
  WS_STABLE_AFTER_MS,
} from '@/config'
import { AuthManager } from '@/core/auth'
import { ERROR_CODES, type FormatCode, SdkDestroyedError, WsError } from '@/core/errors'
import { Logger } from '@/core/logger'

import { computeBackoff } from '../backoff'
import { Lifecycle } from '../lifecycle'
import { BaseWebSocketClient, WebSocketClient } from './client'
import type { LogOptions } from './logs-stream'
import { configurationUrlWs } from './utils'
import { closeQuietly } from './utils/close-quietly'
import { extractWsHandshakeStatus, getWsErrorMessage } from './utils/ws-error'

/**
 * `connecting → open → reconnecting → closed`. `closed` is terminal and
 * reachable from anywhere.
 */
export type LogStreamState = 'connecting' | 'open' | 'reconnecting' | 'closed'

/** Injectable timing/policy knobs. Internal — the public `reconnect` option surface lands with issue #89. */
export interface LogStreamTuning {
  connectTimeoutMs: number
  backoffBaseMs: number
  backoffMaxMs: number
  reconnectBudgetMs: number
  stableAfterMs: number
  /** Clock seam, so budget/stability windows are testable without waiting them out. */
  now: () => number
  /** Delay seam, so backoff is testable without fake timers fighting the real `ws.Server` fixture. */
  sleep: (ms: number) => Promise<void>
}

export interface LogStreamOptions {
  endpoint: string
  /** Already validated against the panel's own range by `resolveLogInterval`. */
  interval: number
  handlers: LogOptions
  basePath: string
  authService: AuthManager
  logger: Logger
  httpsAgent?: HttpAgentLike
  lifecycle: Lifecycle
  /** Called once the stream reaches `closed`, so the owning `LogsStream` can untrack it. */
  onClosed: () => void
  tuning?: Partial<LogStreamTuning>
}

/** Outcome of a single connect attempt. */
type AttemptResult =
  | { outcome: 'opened' }
  | { outcome: 'aborted' }
  | {
      outcome: 'failed'
      /**
       * Only ever defined when the transport reported the rejected handshake's
       * HTTP status — the one piece of positive evidence that the panel
       * actively refused this connection. See {@link extractWsHandshakeStatus}.
       */
      status?: number
      closeCode?: number
      timedOut: boolean
      event?: WebSocketEventMap['error']
    }

const DEFAULT_TUNING: LogStreamTuning = {
  connectTimeoutMs: WS_CONNECT_TIMEOUT_MS,
  backoffBaseMs: WS_BACKOFF_BASE_MS,
  backoffMaxMs: WS_BACKOFF_MAX_MS,
  reconnectBudgetMs: WS_RECONNECT_BUDGET_MS,
  stableAfterMs: WS_STABLE_AFTER_MS,
  now: () => Date.now(),
  sleep: ms =>
    new Promise(resolve => {
      const timer = setTimeout(resolve, ms)
      unrefTimer(timer)
    }),
}

/** Node keeps the process alive for a pending timer; a reconnect backoff must never do that. No-op elsewhere. */
function unrefTimer(timer: ReturnType<typeof setTimeout>): void {
  ;(timer as unknown as { unref?: () => void }).unref?.()
}

/**
 * One logical log stream, from the first `connect*()` call until it's closed —
 * across however many sockets it takes.
 *
 * The invariant that makes shutdown safe is `isStale()`, re-checked after
 * *every* await and at the top of every socket event handler: an SDK-wide
 * `destroy()`, a per-stream `close()`, or a newer socket superseding this one
 * all abort whatever is in flight at its next checkpoint. Callers never have
 * to sequence their shutdown against a reconnect (see ADR-0016).
 */
export class LogStream {
  private readonly endpoint: string
  private readonly interval: number
  private readonly basePath: string
  private readonly authService: AuthManager
  private readonly logger: Logger
  private readonly httpsAgent?: HttpAgentLike
  private readonly lifecycle: Lifecycle
  private readonly onClosed: () => void
  private readonly tuning: LogStreamTuning

  private readonly emitMessage: (data: AnyType) => void
  private readonly emitError: (event: WebSocketEventMap['error']) => void

  private _state: LogStreamState = 'connecting'
  /** Bumped for every new socket, so a superseded socket's late events are ignored. */
  private generation = 0
  private client?: BaseWebSocketClient
  private currentUrl = ''
  private reconnectAttempt = 0
  private budgetDeadline?: number
  private readonly timers = new Set<ReturnType<typeof setTimeout>>()
  /** Kept so a terminal `onError` can forward a real event — `LogOptions.onError` still takes one (issue #89 changes that). */
  private lastDropEvent?: WebSocketEventMap['error']

  constructor(options: LogStreamOptions) {
    this.endpoint = options.endpoint
    this.interval = options.interval
    this.basePath = options.basePath
    this.authService = options.authService
    this.logger = options.logger
    this.httpsAgent = options.httpsAgent
    this.lifecycle = options.lifecycle
    this.onClosed = options.onClosed
    this.tuning = { ...DEFAULT_TUNING, ...options.tuning }

    this.emitMessage = safeCallback(options.handlers.onMessage, error =>
      this.logger.error(`onMessage callback threw (${this.endpoint})`, error, 'LogsStream')
    )
    this.emitError = safeCallback(options.handlers.onError, error =>
      this.logger.error(`onError callback threw (${this.endpoint})`, error, 'LogsStream')
    )
  }

  get state(): LogStreamState {
    return this._state
  }

  /**
   * Runs the first connect. Resolves once the socket is genuinely `open` —
   * not merely constructed — so a misconfigured `baseUrl` or a panel that's
   * down fails loudly here instead of handing back a dead stream.
   *
   * @throws {WsError} When the handshake fails twice, the second time with a
   * freshly issued token.
   * @throws {AuthError} When authenticating for the first attempt fails.
   */
  async open(): Promise<void> {
    this._state = 'connecting'

    try {
      await this.connectPhase(1)
    } catch (error) {
      // A stream that never opened owns no resources worth keeping, and its
      // caller is getting a rejection rather than a close handle — so it
      // untracks itself here instead of relying on the caller to do it.
      this.close()
      throw error
    }

    // Destroyed while the handshake was in flight: the caller is holding a
    // promise for a stream that no longer has an owner, so it rejects for the
    // same reason a post-`destroy()` call would (ADR-0015), rather than
    // handing back a close handle to nothing.
    if (this.lifecycle.destroyed) {
      this.close()
      throw new SdkDestroyedError(`logs.connect(${this.endpoint})`)
    }

    // Closed by the caller mid-connect — they already know; resolving quietly
    // is exactly what they asked for.
    if (this.isStale(this.generation)) return

    this._state = 'open'
    this.logger.info(`WebSocket connection established: ${this.endpoint}`, 'LogsStream')
  }

  /**
   * Terminal and idempotent: stops any in-flight reconnect at its next
   * checkpoint, closes the current socket, and drops every timer.
   */
  close(): void {
    if (this._state === 'closed') return

    this.logger.debug(`Closing WebSocket connection: ${this.endpoint}`, 'LogsStream')
    this._state = 'closed'
    // Bumped so an in-flight attempt's own listeners and post-await checks
    // both see a generation that no longer matches.
    this.generation++
    this.clearTimers()
    this.closeCurrentClient()
    this.onClosed()
  }

  /**
   * True once anything has made this stream's in-flight work irrelevant: the
   * SDK was destroyed, the stream was closed, or a newer socket superseded
   * `generation`.
   */
  private isStale(generation: number): boolean {
    return this._state === 'closed' || this.lifecycle.destroyed || generation !== this.generation
  }

  private clearTimers(): void {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
  }

  private setTimer(handler: () => void, ms: number): ReturnType<typeof setTimeout> {
    const timer = setTimeout(() => {
      this.timers.delete(timer)
      handler()
    }, ms)
    unrefTimer(timer)
    this.timers.add(timer)
    return timer
  }

  private clearTimer(timer: ReturnType<typeof setTimeout>): void {
    clearTimeout(timer)
    this.timers.delete(timer)
  }

  private closeCurrentClient(): void {
    if (!this.client) return
    const failures = closeQuietly(this.client)
    this.client = undefined
    failures.forEach(error =>
      this.logger.error(`Failed to close WebSocket connection: ${this.endpoint}`, error, 'LogsStream')
    )
  }

  /**
   * One connect attempt plus — on failure — exactly one retry with a freshly
   * re-authenticated token, since the panel collapses an expired token into
   * the same generic rejection as everything else (docs/marzban-quirks.md).
   *
   * @throws {WsError} When the retry also fails to reach `open`.
   */
  private async connectPhase(attempt: number): Promise<void> {
    const first = await this.attemptOnce(attempt)
    if (first.outcome !== 'failed') return

    this.logger.warn(`WebSocket handshake failed (${this.endpoint}), retrying once with a fresh token`, 'LogsStream')
    await this.reauthenticate()
    if (this.isStale(this.generation)) return

    const second = await this.attemptOnce(attempt + 1)
    if (second.outcome !== 'failed') return

    throw this.buildWsError(second, attempt + 1)
  }

  /** @throws {WsError} Wrapping whatever `retryAuth()` failed with, so the caller only ever handles one error type. */
  private async reauthenticate(): Promise<void> {
    try {
      await this.authService.retryAuth()
    } catch (error) {
      throw new WsError(ERROR_CODES.WS_AUTH_FAILED, {
        phase: 'handshake',
        attempt: this.reconnectAttempt + 1,
        url: this.currentUrl,
        event: error,
      })
    }
  }

  private buildWsError(result: Extract<AttemptResult, { outcome: 'failed' }>, attempt: number): WsError {
    // A captured status means the panel answered and refused; anything else
    // (native transport, refused connection, timeout) is indistinguishable
    // from a transient network failure, so it never claims to be an auth
    // problem.
    const code = result.status === undefined ? ERROR_CODES.WS_HANDSHAKE_REJECTED : ERROR_CODES.WS_AUTH_FAILED

    return new WsError(code, {
      phase: 'handshake',
      attempt,
      url: this.currentUrl,
      closeCode: result.closeCode,
      status: result.status,
      event: result.event,
    })
  }

  private async ensureAuthenticated(): Promise<void> {
    await this.authService.waitForCurrentAuth()

    if (!this.authService.accessToken) {
      this.logger.warn('No access token available, attempting to re-authenticate', 'LogsStream')
      await this.authService.retryAuth()
    }
  }

  private buildWsUrl(): string {
    const wsUrl = configurationUrlWs({
      basePath: this.basePath,
      endpoint: this.endpoint,
      token: this.authService.accessToken,
      interval: this.interval,
    })

    this.logger.debug(`WebSocket URL generated: ${redactUrlToken(wsUrl, 'token')}`, 'LogsStream')
    return wsUrl
  }

  /**
   * Opens one socket and settles as soon as its fate is known: `open`, a
   * pre-open `error`/`close`, or a connect timeout — the last of which closes
   * the socket rather than leaving it stuck in `CONNECTING` forever.
   *
   * Listeners stay attached past that point: once a socket has opened, its
   * later `error`/`close` is a transport drop, which starts the reconnect loop.
   */
  private async attemptOnce(attempt: number): Promise<AttemptResult> {
    const generation = ++this.generation

    await this.ensureAuthenticated()
    if (this.isStale(generation)) return { outcome: 'aborted' }

    const url = this.buildWsUrl()
    this.currentUrl = url

    // Resolved (not connected) so every listener is attached before `init()`
    // constructs the socket — a connect that fails before the first microtask
    // still reaches them instead of nobody (issue #86).
    const client = WebSocketClient.resolve(url, undefined, { agent: this.httpsAgent })
    this.client = client

    this.logger.debug(`Establishing WebSocket connection to: ${this.endpoint} (attempt ${attempt})`, 'LogsStream')

    return new Promise<AttemptResult>(resolve => {
      // Tracks this socket's own progress, so the `error`+`close` pair every
      // transport emits for one failure is reported once, and a `close` after
      // a successful `open` is routed to the drop handler instead.
      let phase: 'connecting' | 'opened' | 'failed' = 'connecting'
      // Holds this attempt's connect timeout so whichever outcome settles
      // first can drop it; a list keeps the timer and the callback that
      // clears it from having to be declared in a specific order.
      const attemptTimers: Array<ReturnType<typeof setTimeout>> = []
      const clearAttemptTimers = () => attemptTimers.forEach(timer => this.clearTimer(timer))

      const settleFailure = (result: Omit<Extract<AttemptResult, { outcome: 'failed' }>, 'outcome'>) => {
        if (phase !== 'connecting') return
        phase = 'failed'
        clearAttemptTimers()
        closeQuietly(client)
        resolve({ outcome: 'failed', ...result })
      }

      // Cleared by whichever outcome settles the attempt first, so this only
      // ever runs while the handshake is genuinely still in flight.
      const connectTimer = this.setTimer(() => {
        this.logger.warn(`WebSocket handshake timed out after ${this.tuning.connectTimeoutMs}ms`, 'LogsStream')
        settleFailure({ timedOut: true })
      }, this.tuning.connectTimeoutMs)
      attemptTimers.push(connectTimer)

      client.on('open', () => {
        if (phase !== 'connecting') return
        phase = 'opened'
        clearAttemptTimers()

        if (this.isStale(generation)) {
          // Superseded or shut down while the handshake was in flight — this
          // socket has no owner, so it must not be left open on the server.
          closeQuietly(client)
          resolve({ outcome: 'aborted' })
          return
        }

        resolve({ outcome: 'opened' })
      })

      client.on('message', ({ data }) => {
        if (this.isStale(generation)) return
        this.emitMessage(data as AnyType)
      })

      client.on('error', event => {
        const message = getWsErrorMessage(event)
        this.logger.error(`WebSocket error (${this.endpoint}): ${message}`, event, 'LogsStream')

        if (phase === 'connecting') {
          settleFailure({ timedOut: false, status: extractWsHandshakeStatus(message), event })
          return
        }
        // Only a socket that actually opened can drop. In `failed` this is
        // the tail of a failure already reported — forwarding it would reset
        // the reconnect budget and start a second, parallel loop.
        if (phase === 'opened') this.handleDrop(generation, event)
      })

      client.on('close', event => {
        const closeCode = (event as AnyType)?.code as number | undefined

        if (phase === 'connecting') {
          settleFailure({ timedOut: false, closeCode, event: event as AnyType })
          return
        }
        if (phase !== 'opened') return

        this.logger.info(`WebSocket connection closed: ${this.endpoint}`, 'LogsStream')
        this.handleDrop(generation, event as AnyType)
      })

      // A throw from init() (a lazy `import('ws')` that fails, a malformed
      // URL) never reaches the listeners above, so it settles the attempt too.
      client.init().catch((error: unknown) => settleFailure({ timedOut: false, event: error as AnyType }))
    })
  }

  /**
   * A socket that had reached `open` is gone. Starts the reconnect loop —
   * unless this socket has already been superseded, or the stream is done.
   */
  private handleDrop(generation: number, event: WebSocketEventMap['error']): void {
    if (this.isStale(generation)) return

    this._state = 'reconnecting'
    this.lastDropEvent = event

    // An existing deadline is kept deliberately: a stream that flaps — opens,
    // drops, opens, drops — must not hand itself a fresh budget on every
    // drop, or it would retry forever. Only a stable stretch of uptime
    // clears it (see `armStableTimer`), and `reconnectAttempt` carries over
    // for the same reason, so backoff keeps growing across a flap.
    this.budgetDeadline ??= this.tuning.now() + this.tuning.reconnectBudgetMs

    void this.runReconnectLoop(this.budgetDeadline)
  }

  /**
   * Retries with exponential backoff + jitter until the stream opens again,
   * the budget runs out, or the panel positively refuses a freshly
   * authenticated connection.
   */
  private async runReconnectLoop(budgetDeadline: number): Promise<void> {
    for (;;) {
      const generation = this.generation
      this.reconnectAttempt++

      const delay = computeBackoff(this.reconnectAttempt, {
        baseMs: this.tuning.backoffBaseMs,
        maxMs: this.tuning.backoffMaxMs,
        jitter: true,
      })

      this.logger.debug(
        `Reconnecting to ${this.endpoint} in ${Math.round(delay)}ms (attempt ${this.reconnectAttempt})`,
        'LogsStream'
      )
      await this.tuning.sleep(delay)
      if (this.isStale(generation)) return

      if (this.tuning.now() >= budgetDeadline) {
        this.terminate(ERROR_CODES.WS_RETRIES_EXHAUSTED)
        return
      }

      try {
        await this.connectPhase(this.reconnectAttempt)
        if (this.isStale(this.generation)) return

        this._state = 'open'
        this.logger.info(`WebSocket connection re-established: ${this.endpoint}`, 'LogsStream')
        this.armStableTimer()
        return
      } catch (error) {
        if (this.isStale(this.generation)) return

        // Only a status the transport actually reported proves the panel
        // refused us; retrying that with a token we just refreshed is
        // pointless, so it ends the stream instead of burning the budget on
        // logins that can't help (issue #88). Everything else — a native
        // transport with no detail, a refused connection, a timeout — is
        // treated as transient and keeps looping.
        if (error instanceof WsError && error.status !== undefined) {
          this.logger.error(
            `Panel refused the WebSocket handshake with status ${error.status} using a fresh token`,
            error,
            'LogsStream'
          )
          this.terminate(ERROR_CODES.WS_AUTH_FAILED, error.details?.event as WebSocketEventMap['error'])
          return
        }
      }
    }
  }

  /** After a stable stretch, a reconnected stream is treated as healthy again: fresh budget, backoff back to its base. */
  private armStableTimer(): void {
    const generation = this.generation

    this.setTimer(() => {
      if (this.isStale(generation)) return
      this.reconnectAttempt = 0
      this.budgetDeadline = undefined
    }, this.tuning.stableAfterMs)
  }

  /** Ends the stream for good and tells the consumer, since their `connect*()` promise resolved long ago. */
  private terminate(code: FormatCode, event?: WebSocketEventMap['error']): void {
    this.logger.error(`WebSocket stream terminated (${this.endpoint}): ${code.message}`, null, 'LogsStream')

    const failure = event ?? this.lastDropEvent ?? ({ type: 'error', message: code.message } as AnyType)
    this.close()
    this.emitError(failure)
  }
}
