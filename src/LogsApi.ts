import { AuthService } from './AuthService'
import { Logger } from './logger'
import { configurationUrlWs } from './utils/configurationUrlWs'
import { BaseWebSocketClient, WebSocketClient, WebSocketEventMap } from './WebSocketClient'

export interface LogOptions {
  /** Interval for sending messages (in seconds) */
  interval?: number
  /** Callback triggered when a message is received */
  onMessage: (data: WebSocketEventMap['message']['data']) => void
  /** Callback triggered when a connection error occurs */
  onError?: (data: WebSocketEventMap['error']) => void
}

export class LogsApi {
  private basePath: string
  private authService: AuthService
  private activeConnections: Set<BaseWebSocketClient> = new Set()
  private maxRetries = 3
  private logger: Logger

  /**
   * Creates an API instance for handling logs via WebSocket.
   * @param basePath The base URL for WebSocket connections.
   * @param authService Authentication service for managing tokens.
   * @param logger Optional logger instance
   */
  constructor(basePath: string, authService: AuthService, logger: Logger) {
    this.basePath = basePath
    this.authService = authService
    this.logger = logger
  }

  /**
   * Ensures that an access token is available and refreshes it if necessary.
   * @private
   */
  private async ensureAuthenticated() {
    this.logger.debug('Waiting for authentication...', 'LogsApi')
    await this.authService.waitForAuth()

    if (!this.authService.isAuthenticated()) {
      this.logger.info('Not authenticated, retrying auth...', 'LogsApi')
      await this.authService.retryAuth()
    } else {
      this.logger.debug('Authentication verified.', 'LogsApi')
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
  private async connect(endpoint: string, options: LogOptions, retryCount = 0): Promise<() => void> {
    await this.ensureAuthenticated()

    const wsUrl = configurationUrlWs({
      basePath: this.basePath,
      endpoint,
      token: this.authService.getAccessToken(),
      interval: options?.interval ?? 1,
    })

    this.logger.info(`Connecting to WebSocket at ${wsUrl}`, 'LogsApi')
    const wsClient = WebSocketClient.create(wsUrl, this.logger)
    this.activeConnections.add(wsClient)

    wsClient.on('open', () => this.logger.info(`Connected to ${endpoint}`, 'LogsApi'))
    wsClient.on('message', ({ data }) => {
      this.logger.debug(`Received message from ${endpoint}`, 'LogsApi')
      options.onMessage(data)
    })

    wsClient.on('error', async event => {
      const errorMessage = (event as Event & { message: string }).message || ''
      this.logger.error(`WebSocket error (${endpoint}): ${errorMessage}`, event, 'LogsApi')

      if (errorMessage.includes('403')) {
        this.logger.warn(`Received 403 (retry ${retryCount + 1}/${this.maxRetries})`, 'LogsApi')

        if (retryCount >= this.maxRetries) {
          this.logger.error('Max retries reached. Connection failed.', undefined, 'LogsApi')
          options.onError?.(event)
          return
        }

        await this.authService.retryAuth()
        return this.connect(endpoint, options, retryCount + 1)
      }

      options.onError?.(event)
    })

    wsClient.on('close', () => {
      this.activeConnections.delete(wsClient)
      this.logger.info(`Disconnected from ${endpoint}`, 'LogsApi')
    })

    return () => {
      this.logger.info(`Closing WebSocket connection to ${endpoint}`, 'LogsApi')
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
    return this.connect('/api/core/logs', options)
  }

  /**
   * Connects to logs of a specific node (`/api/node/{nodeId}/logs`).
   * @param nodeId The ID of the node whose logs should be accessed.
   * @param options Connection options (callbacks, interval).
   * @returns A function to close the WebSocket connection.
   */
  async connectByNode(nodeId: number | string, options: LogOptions) {
    return this.connect(`/api/node/${nodeId}/logs`, options)
  }

  /**
   * Closes all active WebSocket connections.
   */
  closeAllConnections() {
    this.activeConnections.forEach(wsClient => wsClient.close())
    this.activeConnections.clear()
    this.logger.info('All WebSocket connections closed.', 'LogsApi')
  }
}
