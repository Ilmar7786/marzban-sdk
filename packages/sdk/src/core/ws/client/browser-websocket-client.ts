import { BaseWebSocketClient, WebSocketLike } from './base-websocket-client'

export class BrowserWebSocketClient extends BaseWebSocketClient {
  protected async createWebSocket(): Promise<WebSocketLike> {
    return new WebSocket(this.url, this.protocols)
  }
}
