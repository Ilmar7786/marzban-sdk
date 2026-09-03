import { AnyType, type HttpAgentLike, isBrowser, safeCallback } from '@/common'
import { DEFAULT_RETRIES } from '@/config'
import { AuthManager } from '@/core/auth'
import { Logger } from '@/core/logger'

import { Lifecycle } from '../lifecycle'
import { BaseWebSocketClient, WebSocketClient } from './client'
import { LogsStreamRetryHandler } from './logs-stream-retry'
import { configurationUrlWs } from './utils'
import { closeQuietly } from './utils/close-quietly'
import type { ConnectionHandle, HandleCloseConnection } from './utils/connection-handle.types'
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
  /** Max reconnection attempts on auth (403) failures. Defaults to {@link DEFAULT_RETRIES}. */
  maxRetries?: number
  /**
   * Node-only `https.Agent` (or compatible) for the WebSocket connection —
   * e.g. to trust a self-signed panel certificate. Ignored in the browser.
   */
  httpsAgent?: HttpAgentLike
  /** Shared SDK-instance terminal-state flag. Defaults to a fresh, always-active one when omitted. */
  lifecycle?: Lifecycle
}

/**
 * Handles streaming logs from the Marzban API via WebSocket.
 * Supports both core logs and node-specific logs.
 */
export class LogsStream {
  private basePath: string
  private authService: AuthManager
  private logger: Logger
  private activeConnections: Set<BaseWebSocketClient> = new Set()
  private httpsAgent?: HttpAgentLike
  private lifecycle: Lifecycle
  private retryHandler: LogsStreamRetryHandler

  /**
   * Creates an API instance for handling logs via WebSocket.
   * @param options Configuration for the log stream. See {@link LogsStreamOptions}.
   */
  constructor({
    basePath,
    authService,
    logger,
    maxRetries = DEFAULT_RETRIES,
    httpsAgent,
    lifecycle = new Lifecycle(),
  }: LogsStreamOptions) {
    this.basePath = basePath
    this.authService = authService
    this.logger = logger
    this.httpsAgent = httpsAgent
    this.lifecycle = lifecycle
    this.retryHandler = new LogsStreamRetryHandler({
      authService,
      logger,
      maxRetries,
      lifecycle,
      closeTracked: (wsClient, endpoint) => this.closeTracked(wsClient, endpoint),
      reconnect: (endpoint, options, retryCount) => this.connect(endpoint, options, retryCount),
    })
    this.logger.debug('LogsStream initialized', 'LogsStream')

    if (httpsAgent && isBrowser()) {
      this.logger.warn(
        'httpsAgent is ignored in the browser — it only applies to Node.js WebSocket connections.',
        'LogsStream'
      )
    }
  }

  /**
   * Ensures that an access token is available and refreshes it if necessary.
   * @private
   */
  private async ensureAuthenticated() {
    this.logger.debug('Ensuring authentication for WebSocket connection', 'LogsStream')
    await this.authService.waitForCurrentAuth()

    if (!this.authService.accessToken) {
      this.logger.warn('No access token available, attempting to re-authenticate', 'LogsStream')
      await this.authService.retryAuth()
    } else {
      this.logger.debug('Access token available for WebSocket connection', 'LogsStream')
    }
  }

  private buildWsUrl(endpoint: string, interval: number): string {
    const wsUrl = configurationUrlWs({
      basePath: this.basePath,
      endpoint,
      token: this.authService.accessToken,
      interval,
    })

    // Redact the token query param so JWTs never leak into logs.
    const redactedUrl = wsUrl.replace(/(token=)[^&]+/i, '$1***')
    this.logger.debug(`WebSocket URL generated: ${redactedUrl}`, 'LogsStream')

    return wsUrl
  }

  /**
   * Connects `wsClient`'s socket, undoing the `activeConnections` tracking on
   * failure — a connect that never opens must not leave a dead entry behind.
   */
  private async openConnection(wsClient: BaseWebSocketClient): Promise<void> {
    try {
      await wsClient.init()
    } catch (error) {
      this.activeConnections.delete(wsClient)
      throw error
    }
  }

  /** Closes and untracks `wsClient`, logging rather than throwing if `close()` itself fails. */
  private closeTracked(wsClient: BaseWebSocketClient, endpoint: string): void {
    const failures = closeQuietly(wsClient)
    this.activeConnections.delete(wsClient)
    failures.forEach(error =>
      this.logger.error(`Failed to close WebSocket connection: ${endpoint}`, error, 'LogsStream')
    )
  }

  /** Wraps `options.onMessage`/`onError` so a throw from consumer code is logged, never propagated. */
  private createEmitters(endpoint: string, options: LogOptions) {
    return {
      emitMessage: safeCallback(options.onMessage, error =>
        this.logger.error(`onMessage callback threw (${endpoint})`, error, 'LogsStream')
      ),
      emitError: safeCallback(options.onError, error =>
        this.logger.error(`onError callback threw (${endpoint})`, error, 'LogsStream')
      ),
    }
  }

  /**
   * Attaches every event listener for `wsClient` and returns its close handle.
   * A successful 403 retry repoints `connection.close` at the replacement
   * socket, so callers always close whichever connection is currently active.
   */
  private wireConnection(
    wsClient: BaseWebSocketClient,
    endpoint: string,
    options: LogOptions,
    retryCount: number
  ): ConnectionHandle {
    const { emitMessage, emitError } = this.createEmitters(endpoint, options)

    const connection: ConnectionHandle = {
      close: () => {
        this.logger.debug(`Closing WebSocket connection: ${endpoint}`, 'LogsStream')
        this.closeTracked(wsClient, endpoint)
      },
    }

    wsClient.on('open', () => {
      this.logger.info(`WebSocket connection established: ${endpoint}`, 'LogsStream')
    })

    wsClient.on('message', ({ data }) => {
      emitMessage(data as AnyType)
    })

    wsClient.on('error', event =>
      this.retryHandler.handleError({ wsClient, endpoint, options, retryCount, event, emitError, connection })
    )

    wsClient.on('close', () => {
      this.activeConnections.delete(wsClient)
      this.logger.info(`WebSocket connection closed: ${endpoint}`, 'LogsStream')
    })

    return connection
  }

  /**
   * Establishes a WebSocket connection to a specified endpoint.
   * @private
   * @param endpoint The API endpoint for the WebSocket connection.
   * @param options Connection options (callbacks, interval).
   * @param retryCount The number of retry attempts in case of failure (default is 0).
   * @returns A function to close the WebSocket connection.
   */
  private async connect(endpoint: string, options: LogOptions, retryCount = 0): Promise<HandleCloseConnection> {
    this.lifecycle.assertActive(`logs.connect(${endpoint})`)

    const interval = resolveLogInterval(options.interval)

    this.logger.debug(`Establishing WebSocket connection to: ${endpoint}`, 'LogsStream')
    await this.ensureAuthenticated()

    const wsUrl = this.buildWsUrl(endpoint, interval)

    // Resolved (not yet connected) so every listener is attached before
    // `init()` constructs the socket — a connect that fails before the first
    // microtask still reaches `on('error')`/`on('close')` instead of nobody.
    const wsClient: BaseWebSocketClient = WebSocketClient.resolve(wsUrl, undefined, { agent: this.httpsAgent })
    this.activeConnections.add(wsClient)

    const connection = this.wireConnection(wsClient, endpoint, options, retryCount)
    await this.openConnection(wsClient)

    return () => connection.close()
  }

  /**
   * Connects to the core logs (`/api/core/logs`).
   * @param options Connection options (callbacks, interval).
   * @returns A function to close the WebSocket connection.
   * @throws {SdkDestroyedError} If the owning SDK has been destroyed.
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
   */
  async connectByNode(nodeId: number | string, options: LogOptions) {
    this.logger.debug(`Connecting to node logs WebSocket for node ID: ${nodeId}`, 'LogsStream')
    return this.connect(`/api/node/${nodeId}/logs`, options)
  }

  /**
   * Closes all active WebSocket connections.
   */
  closeAllConnections() {
    const connectionCount = this.activeConnections.size
    this.logger.info(`Closing ${connectionCount} active WebSocket connections`, 'LogsStream')

    // Every socket is closed and untracked even if one throws — a partial
    // cleanup must never look the same as a successful one.
    const failures = [...this.activeConnections].flatMap(closeQuietly)
    this.activeConnections.clear()

    failures.forEach(error => this.logger.error('Failed to close a WebSocket connection', error, 'LogsStream'))
    this.logger.debug('All WebSocket connections closed successfully', 'LogsStream')
  }
}
