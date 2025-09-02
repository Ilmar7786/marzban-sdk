import NodeWebSocket, { type WebSocket as NodeWS } from 'ws'

import { AnyType } from '../../common'

export type WebSocketEventMap = {
  open: Event
  message: MessageEvent
  close: CloseEvent
  error: Event
}

export abstract class BaseWebSocketClient {
  protected socket: WebSocket | NodeWS
  protected url: string
  protected protocols?: string | string[]

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
    this.socket = this.createWebSocket()
  }

  protected abstract createWebSocket(): WebSocket | NodeWS

  on<K extends keyof WebSocketEventMap>(event: K, listener: (event: WebSocketEventMap[K]) => void): void {
    this.socket.addEventListener(event, listener as AnyType)
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

class BrowserWebSocketClient extends BaseWebSocketClient {
  protected createWebSocket(): WebSocket {
    return new WebSocket(this.url, this.protocols)
  }
}

class NodeWebSocketClient extends BaseWebSocketClient {
  protected createWebSocket(): NodeWS {
    return new NodeWebSocket(this.url, this.protocols)
  }
}

export class WebSocketClient {
  static create(url: string, protocols?: string | string[]): BaseWebSocketClient {
    if (typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
      return new BrowserWebSocketClient(url, protocols)
    } else {
      return new NodeWebSocketClient(url, protocols)
    }
  }
}
