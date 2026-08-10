import { hasNativeWebSocket } from '@/common'

import { BaseWebSocketClient } from './base-websocket-client'
import { BrowserWebSocketClient } from './browser-websocket-client'
import { NodeWebSocketClient } from './node-websocket-client'

export class WebSocketClient {
  /**
   * Creates a WebSocket client appropriate for the current runtime.
   *
   * Prefers the native global `WebSocket` when available — this covers
   * browsers, Web Workers, Deno, Bun, and Node.js 21+. Only older Node.js
   * runtimes (no global `WebSocket`) fall back to the `ws` package, which is
   * imported lazily so it never loads where a native implementation exists.
   */
  static async create(url: string, protocols?: string | string[]): Promise<BaseWebSocketClient> {
    const client: BaseWebSocketClient = hasNativeWebSocket()
      ? new BrowserWebSocketClient(url, protocols)
      : new NodeWebSocketClient(url, protocols)

    await client.init()
    return client
  }
}
