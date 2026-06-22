import { AnyType } from '@/common'
import { DEFAULT_RETRIES, DEFAULT_WS_INTERVAL } from '@/config'
import { AuthManager } from '@/core/auth'
import { Logger } from '@/core/logger'

import { BaseWebSocketClient, WebSocketClient } from './client'
import { configurationUrlWs } from './utils'

type HandleCloseConnection = () => void

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
  private maxRetries: number

  /**
   * Creates an API instance for handling logs via WebSocket.
   * @param options Configuration for the log stream. See {@link LogsStreamOptions}.
   */
  constructor({ basePath, authService, logger, maxRetries = DEFAULT_RETRIES }: LogsStreamOptions) {
    this.basePath = basePath
    this.authService = authService
    this.logger = logger
    this.maxRetries = maxRetries
    this.logger.debug('LogsStream initialized', 'LogsStream')
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

  /**
   * Establishes a WebSocket connection to a specified endpoint.
   * @private
   * @param endpoint The API endpoint for the WebSocket connection.
   * @param options Connection options (callbacks, interval).
   * @param retryCount The number of retry attempts in case of failure (default is 0).
   * @returns A function to close the WebSocket connection.
   */
  private async connect(endpoint: string, options: LogOptions, retryCount = 0): Promise<HandleCloseConnection> {
    this.logger.debug(`Establishing WebSocket connection to: ${endpoint}`, 'LogsStream')
    await this.ensureAuthenticated()

    const wsUrl = configurationUrlWs({
      basePath: this.basePath,
      endpoint,
      token: this.authService.accessToken,
      interval: options?.interval ?? DEFAULT_WS_INTERVAL,
    })

    // Redact the token query param so JWTs never leak into logs.
    const redactedUrl = wsUrl.replace(/(token=)[^&]+/i, '$1***')
    this.logger.debug(`WebSocket URL generated: ${redactedUrl}`, 'LogsStream')
    const wsClient: BaseWebSocketClient = await WebSocketClient.create(wsUrl)
    this.activeConnections.add(wsClient)

    // Mutable ref so the close handle returned to the caller always points to
    // the currently-active socket, even after a 403 retry replaces it.
    let closeActive: HandleCloseConnection = () => {
      this.logger.debug(`Closing WebSocket connection: ${endpoint}`, 'LogsStream')
      wsClient.close()
      this.activeConnections.delete(wsClient)
    }

    wsClient.on('open', () => {
      this.logger.info(`WebSocket connection established: ${endpoint}`, 'LogsStream')
    })

    wsClient.on('message', async ({ data }) => {
      options.onMessage(data as AnyType)
    })

    wsClient.on('error', async event => {
      const errorMessage = (event as Event & { message: string }).message || ''
      this.logger.error(`WebSocket error (${endpoint}): ${errorMessage}`, event, 'LogsStream')

      if (errorMessage.includes('403')) {
        this.logger.warn(`Received 403 Forbidden (retry ${retryCount + 1}/${this.maxRetries})`, 'LogsStream')

        wsClient.close()
        this.activeConnections.delete(wsClient)

        if (retryCount >= this.maxRetries) {
          this.logger.error('Maximum retry attempts reached, connection failed', null, 'LogsStream')
          options.onError?.(event)
          return
        }

        this.logger.debug('Attempting to re-authenticate and retry connection', 'LogsStream')
        try {
          await this.authService.retryAuth()
          const newClose = await this.connect(endpoint, options, retryCount + 1)
          closeActive = newClose
        } catch {
          options.onError?.(event)
        }
        return
      }

      options.onError?.(event)
    })

    wsClient.on('close', async () => {
      this.activeConnections.delete(wsClient)
      this.logger.info(`WebSocket connection closed: ${endpoint}`, 'LogsStream')
    })

    return () => closeActive()
  }

  /**
   * Connects to the core logs (`/api/core/logs`).
   * @param options Connection options (callbacks, interval).
   * @returns A function to close the WebSocket connection.
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

    this.activeConnections.forEach(wsClient => wsClient.close())
    this.activeConnections.clear()

    this.logger.debug('All WebSocket connections closed successfully', 'LogsStream')
  }
}
