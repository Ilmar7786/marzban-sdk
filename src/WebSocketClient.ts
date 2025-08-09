import NodeWebSocket, { type WebSocket as NodeWS } from 'ws'

import { Logger } from './logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any

/**
 * WebSocket event map for type safety
 */
export type WebSocketEventMap = {
  open: Event
  message: MessageEvent
  close: CloseEvent
  error: Event
}

/**
 * Base class for WebSocket client implementations
 */
export abstract class BaseWebSocketClient {
  protected socket: WebSocket | NodeWS
  protected url: string
  protected protocols?: string | string[]
  protected logger: Logger

  /**
   * Creates a new WebSocket client instance
   *
   * @param url - WebSocket server URL
   * @param protocols - Optional subprotocols
   * @param logger - Optional logger instance
   */
  constructor(url: string, logger: Logger) {
    this.url = url
    this.logger = logger
    this.logger.debug(`Initializing WebSocket client for ${url}`, 'BaseWebSocketClient')
    this.socket = this.createWebSocket()
  }

  /**
   * Creates WebSocket instance for the specific environment
   */
  protected abstract createWebSocket(): WebSocket | NodeWS

  /**
   * Adds an event listener to the WebSocket instance
   *
   * @param event - Event type
   * @param listener - Event handler
   */
  on<K extends keyof WebSocketEventMap>(event: K, listener: (event: WebSocketEventMap[K]) => void): void {
    this.logger.debug(`Adding event listener for: ${event}`, 'BaseWebSocketClient')
    this.socket.addEventListener(event, (e: AnyType) => {
      if (event === 'error') {
        this.logger.error(`WebSocket error on ${this.url}`, e, 'BaseWebSocketClient')
      } else if (event === 'close') {
        this.logger.warn(`WebSocket connection closed: ${this.url}`, 'BaseWebSocketClient')
      } else if (event === 'open') {
        this.logger.info(`WebSocket connection opened: ${this.url}`, 'BaseWebSocketClient')
      }
      listener(e as WebSocketEventMap[K])
    })
  }

  /**
   * Sends data through the WebSocket connection
   *
   * @param data - Data to send
   */
  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
    this.logger.debug(`Sending data via WebSocket to ${this.url}`, 'BaseWebSocketClient')
    this.socket.send(data)
  }

  /**
   * Closes the WebSocket connection
   *
   * @param code - Optional close code
   * @param reason - Optional close reason
   */
  close(code?: number, reason?: string): void {
    this.logger.warn(`Closing WebSocket connection to ${this.url}`, 'BaseWebSocketClient')
    this.socket.close(code, reason)
  }

  /**
   * Returns the ready state of the WebSocket connection
   */
  get readyState(): number {
    return this.socket.readyState
  }
}

/**
 * WebSocket client implementation for browsers
 */
class BrowserWebSocketClient extends BaseWebSocketClient {
  protected createWebSocket(): WebSocket {
    this.logger.debug('Creating browser WebSocket instance', 'BrowserWebSocketClient')
    return new WebSocket(this.url, this.protocols)
  }
}

/**
 * WebSocket client implementation for Node.js
 */
class NodeWebSocketClient extends BaseWebSocketClient {
  protected createWebSocket(): NodeWS {
    this.logger.debug('Creating Node.js WebSocket instance', 'NodeWebSocketClient')
    return new NodeWebSocket(this.url, this.protocols)
  }
}

/**
 * Factory for creating WebSocket client instances
 */
export class WebSocketClient {
  static create(url: string, logger: Logger): BaseWebSocketClient {
    if (typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
      logger?.info(`Creating browser WebSocket client for ${url}`, 'WebSocketClient')
      return new BrowserWebSocketClient(url, logger)
    } else {
      logger?.info(`Creating Node.js WebSocket client for ${url}`, 'WebSocketClient')
      return new NodeWebSocketClient(url, logger)
    }
  }
}
