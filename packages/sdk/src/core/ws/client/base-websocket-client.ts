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
  /**
   * Request headers for the WebSocket upgrade. Only honored by
   * {@link NodeWebSocketClient} — the native `WebSocket` constructor
   * (browsers, Deno, Bun, Node.js 21+) has no headers option at all, a
   * platform limit {@link BrowserWebSocketClient} cannot work around.
   */
  headers?: Record<string, string>
}

type BufferedListener = { event: keyof WebSocketEventMap; listener: (event: AnyType) => void }

export abstract class BaseWebSocketClient {
  protected socket?: WebSocketLike
  protected url: string
  protected protocols?: string | string[]
  protected agent?: HttpAgentLike
  protected headers?: Record<string, string>

  private pendingListeners: BufferedListener[] = []
  private pendingClose?: { code?: number; reason?: string }

  constructor(url: string, protocols?: string | string[], options?: WebSocketClientOptions) {
    this.url = url
    this.protocols = protocols
    this.agent = options?.agent
    this.headers = options?.headers
  }

  /** Override to await whatever the transport needs before construction (e.g. a lazy `import`). */
  protected async prepare(): Promise<void> {}

  /**
   * Synchronous by contract: `init()` attaches every buffered listener in the
   * same tick the socket is constructed, so nothing the transport dispatches
   * immediately (a connection-refused `error`, an instant handshake `close`)
   * is missed.
   */
  protected abstract createWebSocket(): WebSocketLike

  async init(): Promise<void> {
    await this.prepare()
    this.socket = this.createWebSocket()

    for (const { event, listener } of this.pendingListeners) {
      this.socket.addEventListener(event, listener)
    }
    this.pendingListeners = []

    if (this.pendingClose) {
      this.socket.close(this.pendingClose.code, this.pendingClose.reason)
    }
  }

  private get activeSocket(): WebSocketLike {
    if (!this.socket) {
      throw new TypeError('WebSocket is not initialized yet — call init() first')
    }
    return this.socket
  }

  on<K extends keyof WebSocketEventMap>(event: K, listener: (event: WebSocketEventMap[K]) => void): void {
    if (!this.socket) {
      this.pendingListeners.push({ event, listener: listener as (event: AnyType) => void })
      return
    }
    this.socket.addEventListener(event, listener as (event: AnyType) => void)
  }

  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
    this.activeSocket.send(data)
  }

  /** Before `init()`, closes the socket as soon as it exists instead of throwing. */
  close(code?: number, reason?: string): void {
    if (!this.socket) {
      this.pendingClose = { code, reason }
      return
    }
    this.socket.close(code, reason)
  }

  get readyState(): number {
    return this.activeSocket.readyState
  }
}
