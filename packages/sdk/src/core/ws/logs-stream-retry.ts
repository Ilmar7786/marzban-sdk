import { AuthManager } from '@/core/auth'
import { Logger } from '@/core/logger'

import { BaseWebSocketClient } from './client'
import type { LogOptions } from './logs-stream'
import type { ConnectionHandle, HandleCloseConnection } from './utils/connection-handle.types'
import { getWsErrorMessage, isForbiddenWsError } from './utils/ws-error'

export interface LogsStreamRetryHandlerOptions {
  authService: AuthManager
  logger: Logger
  maxRetries: number
  /** Untracks and closes the failed socket, logging rather than throwing if `close()` itself fails. */
  closeTracked: (wsClient: BaseWebSocketClient, endpoint: string) => void
  /** Opens a brand new connection for the same endpoint/options, one retry attempt further in. */
  reconnect: (endpoint: string, options: LogOptions, retryCount: number) => Promise<HandleCloseConnection>
}

/**
 * Owns the WS module's only reconnect policy today: a `403 Forbidden` is
 * treated as an expired token, so it re-authenticates and opens a fresh
 * connection, up to `maxRetries` attempts. Kept separate from `LogsStream`
 * so the broader reconnect rework (#88) can replace this one policy without
 * touching connection setup/teardown.
 */
export class LogsStreamRetryHandler {
  private readonly authService: AuthManager
  private readonly logger: Logger
  private readonly maxRetries: number
  private readonly closeTracked: LogsStreamRetryHandlerOptions['closeTracked']
  private readonly reconnect: LogsStreamRetryHandlerOptions['reconnect']

  constructor(options: LogsStreamRetryHandlerOptions) {
    this.authService = options.authService
    this.logger = options.logger
    this.maxRetries = options.maxRetries
    this.closeTracked = options.closeTracked
    this.reconnect = options.reconnect
  }

  /**
   * Reacts to a socket error: forwards a non-403 error as-is. A 403 untracks
   * the failed socket, then either retries with a freshly re-authenticated
   * token or — once `maxRetries` is reached — gives up and forwards the error.
   */
  async handleError(args: {
    wsClient: BaseWebSocketClient
    endpoint: string
    options: LogOptions
    retryCount: number
    event: WebSocketEventMap['error']
    emitError: (event: WebSocketEventMap['error']) => void
    connection: ConnectionHandle
  }): Promise<void> {
    const { wsClient, endpoint, options, retryCount, event, emitError, connection } = args
    const errorMessage = getWsErrorMessage(event)
    this.logger.error(`WebSocket error (${endpoint}): ${errorMessage}`, event, 'LogsStream')

    if (!isForbiddenWsError(errorMessage)) {
      emitError(event)
      return
    }

    this.closeTracked(wsClient, endpoint)

    if (retryCount >= this.maxRetries) {
      this.logger.error('Maximum retry attempts reached, connection failed', null, 'LogsStream')
      emitError(event)
      return
    }

    this.logger.warn(`Received 403 Forbidden (retry ${retryCount + 1}/${this.maxRetries})`, 'LogsStream')
    this.logger.debug('Attempting to re-authenticate and retry connection', 'LogsStream')

    try {
      await this.authService.retryAuth()
      connection.close = await this.reconnect(endpoint, options, retryCount + 1)
    } catch {
      emitError(event)
    }
  }
}
