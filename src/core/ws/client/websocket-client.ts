import { BaseWebSocketClient } from './base-websocket-client'
import { BrowserWebSocketClient } from './browser-websocket-client'
import { NodeWebSocketClient } from './node-websocket-client'

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
