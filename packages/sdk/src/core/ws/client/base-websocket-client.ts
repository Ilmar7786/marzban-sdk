import { type AnyType, type HttpAgentLike } from '@/common'

export type WebSocketEventMap = {
  open: Event
  message: MessageEvent
  close: CloseEvent
  error: Event
}

/**
 * Minimal structural contract shared by the browser `WebSocket` and the Node
 * `ws` socket. Typing against this keeps the client environment-agnostic
 * without leaking `any` through the public surface.
 */
export interface WebSocketLike {
  addEventListener(type: string, listener: (event: AnyType) => void): void
  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void
  close(code?: number, reason?: string): void
  readonly readyState: number
}

export interface WebSocketClientOptions {
  /**
   * Node-only `http.Agent`/`https.Agent` (or compatible) for the underlying
   * socket — e.g. to trust a self-signed panel certificate. Only honored by
   * {@link NodeWebSocketClient}; the native browser `WebSocket` has no
   * concept of a custom agent, so {@link BrowserWebSocketClient} ignores it.
   */
  agent?: HttpAgentLike
}

export abstract class BaseWebSocketClient {
  protected socket!: WebSocketLike
  protected url: string
  protected protocols?: string | string[]
  protected agent?: HttpAgentLike

  constructor(url: string, protocols?: string | string[], options?: WebSocketClientOptions) {
    this.url = url
    this.protocols = protocols
    this.agent = options?.agent
  }

  protected abstract createWebSocket(): Promise<WebSocketLike>

  async init(): Promise<void> {
    this.socket = await this.createWebSocket()
  }

  on<K extends keyof WebSocketEventMap>(event: K, listener: (event: WebSocketEventMap[K]) => void): void {
    this.socket.addEventListener(event, listener as (event: AnyType) => void)
  }

  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
    this.socket.send(data)
  }

  close(code?: number, reason?: string): void {
    this.socket.close(code, reason)
  }

  get readyState(): number {
    return this.socket.readyState
  }
}
