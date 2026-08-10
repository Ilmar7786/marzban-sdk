import { type AnyType } from '@/common'

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

export abstract class BaseWebSocketClient {
  protected socket!: WebSocketLike
  protected url: string
  protected protocols?: string | string[]

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
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
