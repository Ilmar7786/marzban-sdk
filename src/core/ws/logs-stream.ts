import { AnyType } from '../../common'
import { AuthManager } from '../auth/auth.manager'
import { Logger } from '../logger'
import type { PluginRegistry } from '../plugin/plugin.registry'
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
 * Handles streaming logs from the Marzban API via WebSocket.
 * Supports both core logs and node-specific logs.
 */
export class LogsStream {
  private basePath: string
  private authService: AuthManager
  private logger: Logger
  private activeConnections: Set<BaseWebSocketClient> = new Set()
  private plugins?: PluginRegistry
  private maxRetries = 3

  /**
   * Creates an API instance for handling logs via WebSocket.
   * @param basePath The base URL for WebSocket connections.
   * @param authService Authentication service for managing tokens.
   * @param logger Logger instance for logging WebSocket events.
   * @param plugins Optional plugin registry for extending WebSocket behavior.
   */
  constructor(basePath: string, authService: AuthManager, logger: Logger, plugins?: PluginRegistry) {
    this.basePath = basePath
    this.authService = authService
    this.logger = logger
    this.plugins = plugins
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
    this.logger.info(`Establishing WebSocket connection to: ${endpoint}`, 'LogsStream')
    await this.ensureAuthenticated()

    const wsUrl = configurationUrlWs({
      basePath: this.basePath,
      endpoint,
      token: this.authService.accessToken,
      interval: options?.interval ?? 1,
    })

    this.logger.debug(`WebSocket URL generated: ${wsUrl}`, 'LogsStream')
    try {
      await this.plugins?.runWsConnect({ url: wsUrl })
    } catch {
      this.logger.warn('Plugin onWsConnect hook failed', 'LogsStream')
    }

    const wsClient: BaseWebSocketClient = await WebSocketClient.create(wsUrl)
    this.activeConnections.add(wsClient)

    wsClient.on('open', () => {
      this.logger.info(`WebSocket connection established: ${endpoint}`, 'LogsStream')
    })

    wsClient.on('message', async ({ data }) => {
      this.logger.debug(`WebSocket message received from ${endpoint}`, 'LogsStream')
      let nextData: unknown = data
      try {
        nextData = (await this.plugins?.runWsMessage(data, { url: wsUrl })) ?? data
      } catch {
        this.logger.warn('Plugin onWsMessage hook failed', 'LogsStream')
      }
      // Forward possibly transformed payload
      options.onMessage(nextData as AnyType)
    })

    wsClient.on('error', async event => {
      const errorMessage = (event as Event & { message: string }).message || ''
      this.logger.error(`WebSocket error (${endpoint}): ${errorMessage}`, event, 'LogsStream')

      if (errorMessage.includes('403')) {
        this.logger.warn(`Received 403 Forbidden (retry ${retryCount + 1}/${this.maxRetries})`, 'LogsStream')

        if (retryCount >= this.maxRetries) {
          this.logger.error('Maximum retry attempts reached, connection failed', null, 'LogsStream')
          options.onError?.(event)
          return
        }

        this.logger.info('Attempting to re-authenticate and retry connection', 'LogsStream')
        await this.authService.retryAuth()
        return this.connect(endpoint, options, retryCount + 1)
      }

      options.onError?.(event)
    })

    wsClient.on('close', async () => {
      this.activeConnections.delete(wsClient)
      this.logger.info(`WebSocket connection closed: ${endpoint}`, 'LogsStream')
      try {
        await this.plugins?.runWsClose({ url: wsUrl, code: 1000 })
      } catch {
        this.logger.warn('Plugin onWsClose hook failed', 'LogsStream')
      }
    })

    return () => {
      this.logger.debug(`Closing WebSocket connection: ${endpoint}`, 'LogsStream')
      wsClient.close()
      this.activeConnections.delete(wsClient)
    }
  }

  /**
   * Connects to the core logs (`/api/core/logs`).
   * @param options Connection options (callbacks, interval).
   * @returns A function to close the WebSocket connection.
   */
  async connectByCore(options: LogOptions) {
    this.logger.info('Connecting to core logs WebSocket', 'LogsStream')
    return this.connect('/api/core/logs', options)
  }

  /**
   * Connects to logs of a specific node (`/api/node/{nodeId}/logs`).
   * @param nodeId The ID of the node whose logs should be accessed.
   * @param options Connection options (callbacks, interval).
   * @returns A function to close the WebSocket connection.
   */
  async connectByNode(nodeId: number | string, options: LogOptions) {
    this.logger.info(`Connecting to node logs WebSocket for node ID: ${nodeId}`, 'LogsStream')
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

    this.logger.info('All WebSocket connections closed successfully', 'LogsStream')
  }
}
