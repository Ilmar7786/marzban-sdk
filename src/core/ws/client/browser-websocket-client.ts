import { BaseWebSocketClient } from './base-websocket-client'

export class BrowserWebSocketClient extends BaseWebSocketClient {
  protected async createWebSocket(): Promise<WebSocket> {
    return new WebSocket(this.url, this.protocols)
  }
}
