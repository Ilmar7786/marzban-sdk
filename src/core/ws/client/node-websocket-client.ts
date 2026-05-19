import { BaseWebSocketClient } from './base-websocket-client'

export class NodeWebSocketClient extends BaseWebSocketClient {
  protected async createWebSocket() {
    const { default: NodeWebSocket } = await import('ws')
    return new NodeWebSocket(this.url, this.protocols)
  }
}
