import { type HttpAgentLike, isBrowser } from '@/common'
import { AuthManager } from '@/core/auth'
import { Logger } from '@/core/logger'

import { Lifecycle } from '../lifecycle'
import { LogStream, type LogStreamTuning } from './log-stream'
import type { HandleCloseConnection } from './utils/connection-handle.types'
import { resolveLogInterval } from './utils/log-interval'

/**
 * Options for configuring a WebSocket log stream.
 */
export interface LogOptions {
  /** Interval for sending messages (in seconds) */
  interval?: number
  /** Callback triggered when a message is received */
  onMessage: (data: WebSocketEventMap['message']['data']) => void
  /** Callback triggered when a connection error occurs */
  onError?: (data: WebSocketEventMap['error']) => void
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
  private async connect(endpoint: string, options: LogOptions): Promise<HandleCloseConnection> {
    this.lifecycle.assertActive(`logs.connect(${endpoint})`)

    const interval = resolveLogInterval(options.interval)

    const stream = new LogStream({
      endpoint,
      interval,
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

    return () => stream.close()
  }

  /**
   * Connects to the core logs (`/api/core/logs`).
   * @param options Connection options (callbacks, interval).
   * @returns A function to close the WebSocket connection.
   * @throws {SdkDestroyedError} If the owning SDK has been destroyed.
   * @throws {WsOptionsError} If `interval` is outside the range the panel accepts.
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
   * @returns A function to close the WebSocket connection.
   * @throws {SdkDestroyedError} If the owning SDK has been destroyed.
   * @throws {WsOptionsError} If `interval` is outside the range the panel accepts.
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
