import { AnyType, type HttpAgentLike, redactUrlToken, safeCallback } from '@/common'
import {
  WS_BACKOFF_BASE_MS,
  WS_BACKOFF_MAX_MS,
  WS_CONNECT_TIMEOUT_MS,
  WS_RECONNECT_BUDGET_MS,
  WS_STABLE_AFTER_MS,
} from '@/config'
import { AuthManager } from '@/core/auth'
import { ERROR_CODES, SdkDestroyedError, WsError } from '@/core/errors'
import { Logger } from '@/core/logger'

import { computeBackoff } from '../backoff'
import { Lifecycle } from '../lifecycle'
import { BaseWebSocketClient, WebSocketClient } from './client'
import type { LogOptions, WsCloseInfo, WsReconnectInfo } from './logs-stream'
import { configurationUrlWs } from './utils'
import { closeQuietly } from './utils/close-quietly'
import { decideReconnect } from './utils/reconnect-decision'
import { reconnectPolicyToTuning, type ResolvedReconnectPolicy } from './utils/reconnect-policy'
import { createReplayFilter, type ReplayFilter, type ReplayMode } from './utils/replay'
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
  /** Already validated by `resolveReplayMode`. */
  replay: ReplayMode
  /** Already validated and resolved by `resolveReconnectPolicy`. */
  reconnect: ResolvedReconnectPolicy
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

/**
 * Outcome of {@link LogStream.runReconnectLoop}: `'opened'` once a socket is
 * genuinely open again, `'failed'` when the policy or the budget gives up,
 * `'aborted'` when the stream went stale (closed, destroyed, or superseded)
 * partway through — nothing to report either way.
 */
type ReconnectLoopOutcome = { outcome: 'opened' } | { outcome: 'aborted' } | { outcome: 'failed'; error: WsError }

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
  /** Non-timing parts of the reconnect policy — `tuning` carries the timing overrides instead (see the constructor). */
  private readonly policy: ResolvedReconnectPolicy

  private readonly replay: ReplayFilter
  /** Safe-wrapped `onMessage` — call `emitMessage()` instead, which applies the replay filter first. */
  private readonly deliverMessage: (data: AnyType) => void
  private readonly emitError: (error: WsError) => void
  private readonly emitOpen: () => void
  private readonly emitReconnect: (info: WsReconnectInfo) => void
  private readonly emitClose: (info: WsCloseInfo) => void

  private _state: LogStreamState = 'connecting'
  /** Set once the stream first reaches `open` — gates whether a self-inflicted end reports through `onError`/`onClose` at all (ADR-0016: a failure before that point is reported through the `connect*()` rejection alone). */
  private everOpened = false
  /** Bumped for every new socket, so a superseded socket's late events are ignored. */
  private generation = 0
  private client?: BaseWebSocketClient
  private currentUrl = ''
  private reconnectAttempt = 0
  private budgetDeadline?: number
  /** When the most recent drop happened — set by `handleDrop()`, read by a successful reconnect to compute `WsReconnectInfo.downtimeMs`. */
  private dropStartedAt?: number
  private readonly timers = new Set<ReturnType<typeof setTimeout>>()
  /** The most recent transport drop, wrapped as a `WsError` — reused as the best-effort event when the reconnect budget expires with nothing new to report. */
  private lastError?: WsError

  constructor(options: LogStreamOptions) {
    this.endpoint = options.endpoint
    this.interval = options.interval
    this.basePath = options.basePath
    this.authService = options.authService
    this.logger = options.logger
    this.httpsAgent = options.httpsAgent
    this.lifecycle = options.lifecycle
    this.onClosed = options.onClosed
    // `tuning` layering: module defaults < the policy's explicit timing
    // overrides < the internal test-only seam, which must always win so
    // logs-stream.server.test.ts's `tune(instance, {...})` isn't silently
    // clobbered by a fully-populated policy.
    this.tuning = { ...DEFAULT_TUNING, ...reconnectPolicyToTuning(options.reconnect), ...options.tuning }
    this.policy = options.reconnect
    this.replay = createReplayFilter(options.replay)

    this.deliverMessage = safeCallback(options.handlers.onMessage, error =>
      this.logger.error(`onMessage callback threw (${this.endpoint})`, error, 'LogsStream')
    )
    this.emitError = safeCallback(options.handlers.onError, error =>
      this.logger.error(`onError callback threw (${this.endpoint})`, error, 'LogsStream')
    )
    this.emitOpen = safeCallback<void>(options.handlers.onOpen, error =>
      this.logger.error(`onOpen callback threw (${this.endpoint})`, error, 'LogsStream')
    )
    this.emitReconnect = safeCallback(options.handlers.onReconnect, error =>
      this.logger.error(`onReconnect callback threw (${this.endpoint})`, error, 'LogsStream')
    )
    this.emitClose = safeCallback(options.handlers.onClose, error =>
      this.logger.error(`onClose callback threw (${this.endpoint})`, error, 'LogsStream')
    )
  }

  get state(): LogStreamState {
    return this._state
  }

  /** Applies the replay filter, then delivers to `onMessage` if it isn't a suppressed replay of an already-seen line. */
  private emitMessage(data: AnyType): void {
    const decision = this.replay.accept(data)
    if (decision.deliver) this.deliverMessage(decision.data as AnyType)
  }

  /**
   * Runs the first connect. Resolves once the socket is genuinely `open` —
   * not merely constructed — so a misconfigured `baseUrl` or a panel that's
   * down fails loudly here instead of handing back a dead stream.
   *
   * With `reconnect.initial`, a failed first connect is retried through the
   * same policy-gated loop a post-open drop uses, instead of rejecting
   * immediately — but a failure still only ever rejects this promise, never
   * `onError`/`onClose`, since the stream never reached `open` (ADR-0016:
   * reported exactly once).
   *
   * @throws {WsError} When the handshake fails twice, the second time with a
   * freshly issued token — or, with `reconnect.initial`, when the retry loop
   * itself gives up.
   * @throws {AuthError} When authenticating for the first attempt fails.
   */
  async open(): Promise<void> {
    this._state = 'connecting'

    try {
      await this.connectPhase(1)
    } catch (error) {
      if (!this.policy.initial || this.isStale(this.generation)) {
        // A stream that never opened owns no resources worth keeping, and its
        // caller is getting a rejection rather than a close handle — so it
        // untracks itself here instead of relying on the caller to do it.
        this.close()
        throw error
      }

      this.dropStartedAt = this.tuning.now()
      // connectPhase() only ever throws a WsError (see its @throws contract).
      this.lastError = error as WsError
      this.budgetDeadline = this.tuning.now() + this.tuning.reconnectBudgetMs

      const outcome = await this.runReconnectLoop(this.budgetDeadline)

      if (outcome.outcome === 'failed') {
        this.logger.error(
          `WebSocket stream never opened (${this.endpoint}): ${outcome.error.message}`,
          outcome.error,
          'LogsStream'
        )
        this.shutdown()
        throw outcome.error
      }
      // 'opened' or 'aborted' fall through to the checks below, exactly like
      // a direct first-attempt success — an 'aborted' loop is caught by the
      // isStale() check right after.
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

    this.markOpen()
    this.logger.info(`WebSocket connection established: ${this.endpoint}`, 'LogsStream')
    this.emitOpen()
  }

  /** Transitions into `open`, once and for all — first connect or a successful reconnect. */
  private markOpen(): void {
    this._state = 'open'
    this.everOpened = true
  }

  /**
   * Terminal and idempotent: stops any in-flight reconnect at its next
   * checkpoint, closes the current socket, and drops every timer.
   *
   * Reports through `onClose({ byCaller: true })` — but only if the stream
   * ever reached `open`; a first connect that never got there is reported
   * through the `connect*()` rejection alone (ADR-0016).
   */
  close(): void {
    if (this._state === 'closed') return

    const everOpened = this.everOpened
    this.shutdown()
    if (everOpened) this.emitClose({ byCaller: true })
  }

  /** State transition shared by `close()` and `terminate()`: stop, drop every timer and the socket, untrack. */
  private shutdown(): void {
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
    this.dropStartedAt = this.tuning.now()
    // Armed only here — never on the first connect, where the ring is empty anyway.
    this.replay.arm()
    this.lastError = new WsError(ERROR_CODES.WS_CONNECTION_LOST, {
      phase: 'connection',
      attempt: this.reconnectAttempt + 1,
      url: this.currentUrl,
      closeCode: (event as AnyType)?.code,
      event,
    })

    // An existing deadline is kept deliberately: a stream that flaps — opens,
    // drops, opens, drops — must not hand itself a fresh budget on every
    // drop, or it would retry forever. Only a stable stretch of uptime
    // clears it (see `armStableTimer`), and `reconnectAttempt` carries over
    // for the same reason, so backoff keeps growing across a flap.
    this.budgetDeadline ??= this.tuning.now() + this.tuning.reconnectBudgetMs

    void this.runReconnectLoop(this.budgetDeadline).then(outcome => {
      if (outcome.outcome === 'opened') {
        this.markOpen()
        this.logger.info(`WebSocket connection re-established: ${this.endpoint}`, 'LogsStream')
        this.emitOpen()
        // `dropStartedAt` is always set here: the only path into this loop is
        // `handleDrop()`, which sets it right before the first iteration.
        this.emitReconnect({ attempt: this.reconnectAttempt, downtimeMs: this.tuning.now() - this.dropStartedAt! })
        this.armStableTimer()
      } else if (outcome.outcome === 'failed') {
        this.terminate(outcome.error)
      }
      // 'aborted': the loop already found the stream stale (closed,
      // destroyed, or superseded) — nothing to report, same as before.
    })
  }

  /**
   * Retries with exponential backoff + jitter — gated by the reconnect
   * policy on every attempt — until the stream opens again, the policy
   * declines to continue, the budget runs out, or the panel positively
   * refuses a freshly authenticated connection.
   *
   * Owns no state transitions or emits itself: it hands its outcome back to
   * the caller, since a post-open drop (`handleDrop`) and a `reconnect.initial`
   * retry of the very first connect (`open`) each have to report it
   * differently (ADR-0016: a failure before the stream ever opened rejects
   * `connect*()` directly, never through `onError`/`onClose`).
   */
  private async runReconnectLoop(budgetDeadline: number): Promise<ReconnectLoopOutcome> {
    for (;;) {
      const generation = this.generation
      const attempt = this.reconnectAttempt + 1

      const baseDelayMs = computeBackoff(attempt, {
        baseMs: this.tuning.backoffBaseMs,
        maxMs: this.tuning.backoffMaxMs,
        jitter: true,
      })
      // `dropStartedAt` and `lastError` are always set here: this loop only
      // ever runs after `handleDrop()` or `open()`'s `reconnect.initial`
      // branch set them first.
      const verdict = decideReconnect({
        policy: this.policy,
        attempt,
        elapsedMs: this.tuning.now() - this.dropStartedAt!,
        baseDelayMs,
        error: this.lastError!,
      })

      if (!verdict.retry) return { outcome: 'failed', error: this.lastError! }

      this.reconnectAttempt = attempt
      this.logger.debug(
        `Reconnecting to ${this.endpoint} in ${Math.round(verdict.delayMs)}ms (attempt ${attempt})`,
        'LogsStream'
      )
      await this.tuning.sleep(verdict.delayMs)
      if (this.isStale(generation)) return { outcome: 'aborted' }

      if (this.tuning.now() >= budgetDeadline) {
        // Reused as the best-effort event to report — nothing new happened,
        // the budget simply ran out.
        const lastError = this.lastError!
        return {
          outcome: 'failed',
          error: new WsError(ERROR_CODES.WS_RETRIES_EXHAUSTED, {
            phase: 'connection',
            attempt: this.reconnectAttempt,
            url: this.currentUrl,
            closeCode: lastError.closeCode,
            event: lastError.details?.event,
          }),
        }
      }

      try {
        await this.connectPhase(this.reconnectAttempt)
        if (this.isStale(this.generation)) return { outcome: 'aborted' }

        return { outcome: 'opened' }
      } catch (error) {
        if (this.isStale(this.generation)) return { outcome: 'aborted' }

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
          return { outcome: 'failed', error }
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

  /**
   * Ends the stream for good and tells the consumer, since their
   * `connect*()` promise resolved long ago: `onError(error)` followed by
   * `onClose({ byCaller: false })`. Only ever reached after the stream has
   * opened at least once (both call sites are downstream of `handleDrop()`),
   * so — unlike `close()` — this never needs to check `everOpened`.
   */
  private terminate(error: WsError): void {
    this.logger.error(`WebSocket stream terminated (${this.endpoint}): ${error.message}`, error, 'LogsStream')

    this.shutdown()
    this.emitError(error)
    this.emitClose({ code: error.closeCode, byCaller: false })
  }
}
