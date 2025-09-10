import { type AnyType } from '../../common'

export type WebSocketEventMap = {
  open: Event
  message: MessageEvent
  close: CloseEvent
  error: Event
}

export abstract class BaseWebSocketClient {
  protected socket: WebSocket | AnyType
  protected url: string
  protected protocols?: string | string[]

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
  }

  protected abstract createWebSocket(): Promise<WebSocket | AnyType>

  async init(): Promise<void> {
    this.socket = await this.createWebSocket()
  }

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
  protected async createWebSocket(): Promise<WebSocket> {
    return new WebSocket(this.url, this.protocols)
  }
}

class NodeWebSocketClient extends BaseWebSocketClient {
  protected async createWebSocket(): Promise<AnyType> {
    const { default: NodeWebSocket } = await import('ws')
    return new NodeWebSocket(this.url, this.protocols)
  }
}

export class WebSocketClient {
  static async create(url: string, protocols?: string | string[]): Promise<BaseWebSocketClient> {
    let client: BaseWebSocketClient

    if (typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
      client = new BrowserWebSocketClient(url, protocols)
    } else {
      client = new NodeWebSocketClient(url, protocols)
    }

    await client.init()
    return client
  }
}
