import { AuthService } from './AuthService'
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

  /**
   * Creates an API instance for handling logs via WebSocket.
   * @param basePath The base URL for WebSocket connections.
   * @param authService Authentication service for managing tokens.
   */
  constructor(basePath: string, authService: AuthService) {
    this.basePath = basePath
    this.authService = authService
  }

  /**
   * Ensures that an access token is available and refreshes it if necessary.
   * @private
   */
  private async ensureAuthenticated() {
    await this.authService.waitForAuth()

    if (!this.authService.accessToken) {
      await this.authService.retryAuth()
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
      token: this.authService.accessToken,
      interval: options?.interval ?? 1,
    })

    const wsClient = WebSocketClient.create(wsUrl)
    this.activeConnections.add(wsClient)

    wsClient.on('open', () => console.log(`Connected to ${endpoint}`))
    wsClient.on('message', ({ data }) => options.onMessage(data))

    wsClient.on('error', async event => {
      const errorMessage = (event as Event & { message: string }).message || ''

      console.error(`WebSocket error (${endpoint}):`, errorMessage)

      if (errorMessage.includes('403')) {
        console.warn(`Received 403 (retry ${retryCount + 1}/${this.maxRetries})`)

        if (retryCount >= this.maxRetries) {
          console.error('Max retries reached. Connection failed.')
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
      console.log(`Disconnected from ${endpoint}`)
    })

    return () => {
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
    console.log('All WebSocket connections closed.')
  }
}
