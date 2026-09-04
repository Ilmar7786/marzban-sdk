import { type HttpAgentLike, isBrowser } from '@/common'
import { AuthManager } from '@/core/auth'
import { WsError } from '@/core/errors'
import { Logger } from '@/core/logger'

import { Lifecycle } from '../lifecycle'
import { LogStream, type LogStreamState, type LogStreamTuning } from './log-stream'
import { resolveLogInterval } from './utils/log-interval'
import { type ReplayMode, resolveReplayMode } from './utils/replay'
import { createStreamHandle, type StreamHandle } from './utils/stream-handle'

export type { ReplayMode }

/** Handle returned by `connect*()`: callable (closes the stream), plus an explicit `close()` and a live `state`. */
export type LogStreamHandle = StreamHandle<LogStreamState>

/** Passed to `LogOptions.onClose` once, when the logical stream ends for good. */
export interface WsCloseInfo {
  /** The WebSocket close code, when one is known — absent for a caller-initiated close. */
  code?: number
  /** `true` when the consumer ended the stream (the handle, `close()`, or `sdk.destroy()`); `false` when it died on its own. */
  byCaller: boolean
}

/** Passed to `LogOptions.onReconnect` when a dropped stream successfully reopens. */
export interface WsReconnectInfo {
  /** 1-based reconnect attempt that succeeded. Carries over across a flapping connection. */
  attempt: number
  /** Time (ms) since the most recent drop — not the start of a longer flapping sequence. */
  downtimeMs: number
}

/**
 * Options for configuring a WebSocket log stream.
 */
export interface LogOptions {
  /** Interval for sending messages (in seconds) */
  interval?: number
  /** Callback triggered when a message is received */
  onMessage: (data: WebSocketEventMap['message']['data']) => void
  /** Called once the stream ends for good, with a typed error — never a raw transport event. */
  onError?: (error: WsError) => void
  /** Called every time the stream reaches `open` — the first connect and each successful reconnect. */
  onOpen?: () => void
  /** Called when a dropped stream successfully reopens. */
  onReconnect?: (info: WsReconnectInfo) => void
  /** Called once, when the stream ends for good — only if it ever reached `open`. */
  onClose?: (info: WsCloseInfo) => void
  /**
   * How to handle log lines the panel re-delivers after a reconnect — it
   * seeds every new connection from a shared buffer of its last ~100 lines
   * (docs/marzban-quirks.md), with no cursor to resume from instead.
   *
   * - `'dedup'` (default) — suppress lines already delivered before the drop.
   * - `'all'` — deliver everything, duplicates included.
   * - `'skip'` — drop every replayed message outright, until the first one
   *   that carries no previously-delivered line.
   */
  replay?: ReplayMode
}

/**
 * Options for constructing a {@link LogsStream}.
 */
export interface LogsStreamOptions {
  /** Base URL for WebSocket connections. */
  basePath: string
  /** Authentication service for managing tokens. */
  authService: AuthManager
  /** Logger instance for logging WebSocket events. */
  logger: Logger
  /**
   * Node-only `https.Agent` (or compatible) for the WebSocket connection —
   * e.g. to trust a self-signed panel certificate. Ignored in the browser.
   */
  httpsAgent?: HttpAgentLike
  /** Shared SDK-instance terminal-state flag. Defaults to a fresh, always-active one when omitted. */
  lifecycle?: Lifecycle
  /**
   * Overrides for the reconnect policy's timing. Internal — used by this
   * package's own tests to exercise backoff/budget/timeout behavior without
   * waiting out the real windows. The public option surface lands with
   * issue #89.
   *
   * @internal
   */
  tuning?: Partial<LogStreamTuning>
}

/**
 * Handles streaming logs from the Marzban API via WebSocket.
 * Supports both core logs and node-specific logs.
 *
 * Owns the set of live streams; each {@link LogStream} owns its own socket,
 * reconnect policy, and shutdown guarantees (see ADR-0016).
 */
export class LogsStream {
  private basePath: string
  private authService: AuthManager
  private logger: Logger
  private activeStreams: Set<LogStream> = new Set()
  private httpsAgent?: HttpAgentLike
  private lifecycle: Lifecycle
  private tuning?: Partial<LogStreamTuning>

  /**
   * Creates an API instance for handling logs via WebSocket.
   * @param options Configuration for the log stream. See {@link LogsStreamOptions}.
   */
  constructor({ basePath, authService, logger, httpsAgent, lifecycle = new Lifecycle(), tuning }: LogsStreamOptions) {
    this.basePath = basePath
    this.authService = authService
    this.logger = logger
    this.httpsAgent = httpsAgent
    this.lifecycle = lifecycle
    this.tuning = tuning
    this.logger.debug('LogsStream initialized', 'LogsStream')

    if (httpsAgent && isBrowser()) {
      this.logger.warn(
        'httpsAgent is ignored in the browser — it only applies to Node.js WebSocket connections.',
        'LogsStream'
      )
    }
  }

  /**
   * Establishes a WebSocket connection to a specified endpoint.
   *
   * Resolves only once the socket is genuinely open, so a failed first
   * connect rejects instead of handing back a handle to a dead stream.
   */
  private async connect(endpoint: string, options: LogOptions): Promise<LogStreamHandle> {
    this.lifecycle.assertActive(`logs.connect(${endpoint})`)

    const interval = resolveLogInterval(options.interval)
    const replay = resolveReplayMode(options.replay)

    const stream = new LogStream({
      endpoint,
      interval,
      replay,
      handlers: options,
      basePath: this.basePath,
      authService: this.authService,
      logger: this.logger,
      httpsAgent: this.httpsAgent,
      lifecycle: this.lifecycle,
      onClosed: () => this.activeStreams.delete(stream),
      tuning: this.tuning,
    })
    this.activeStreams.add(stream)

    await stream.open()

    return createStreamHandle(stream)
  }

  /**
   * Connects to the core logs (`/api/core/logs`).
   * @param options Connection options (callbacks, interval).
   * @returns A {@link LogStreamHandle} — callable to close the stream (source-compatible with the
   * bare close function this used to return), plus an explicit `close()` and a live `state`.
   * @throws {SdkDestroyedError} If the owning SDK has been destroyed.
   * @throws {WsOptionsError} If `interval` is outside the range the panel accepts, or `replay` is invalid.
   * @throws {WsError} If the connection cannot be established.
   */
  async connectByCore(options: LogOptions) {
    this.logger.debug('Connecting to core logs WebSocket', 'LogsStream')
    return this.connect('/api/core/logs', options)
  }

  /**
   * Connects to logs of a specific node (`/api/node/{nodeId}/logs`).
   * @param nodeId The ID of the node whose logs should be accessed.
   * @param options Connection options (callbacks, interval).
   * @returns A {@link LogStreamHandle} — callable to close the stream (source-compatible with the
   * bare close function this used to return), plus an explicit `close()` and a live `state`.
   * @throws {SdkDestroyedError} If the owning SDK has been destroyed.
   * @throws {WsOptionsError} If `interval` is outside the range the panel accepts, or `replay` is invalid.
   * @throws {WsError} If the connection cannot be established.
   */
  async connectByNode(nodeId: number | string, options: LogOptions) {
    this.logger.debug(`Connecting to node logs WebSocket for node ID: ${nodeId}`, 'LogsStream')
    return this.connect(`/api/node/${nodeId}/logs`, options)
  }

  /**
   * Closes all active WebSocket connections.
   *
   * Each stream's own `close()` is what stops it — including one that is
   * mid-reconnect, which aborts at its next checkpoint rather than racing
   * this call to open a replacement socket.
   */
  closeAllConnections() {
    this.logger.info(`Closing ${this.activeStreams.size} active WebSocket connections`, 'LogsStream')

    // Iterated over a copy: each close() untracks itself from the live set.
    // Every stream is closed even if one throws — a partial cleanup must
    // never look the same as a successful one.
    const failures = [...this.activeStreams].flatMap(stream => {
      try {
        stream.close()
        return []
      } catch (error) {
        return [error]
      }
    })
    this.activeStreams.clear()

    failures.forEach(error => this.logger.error('Failed to close a WebSocket connection', error, 'LogsStream'))
    this.logger.debug('All WebSocket connections closed successfully', 'LogsStream')
  }
}
