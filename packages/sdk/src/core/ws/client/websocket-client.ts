import { hasNativeWebSocket, isBrowser } from '@/common'

import { BaseWebSocketClient, WebSocketClientOptions } from './base-websocket-client'
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
   *
   * `options.agent` overrides that preference outside the browser: neither
   * the native browser `WebSocket` nor Node's own global `WebSocket` (21+)
   * can be given a custom `http.Agent`, so a configured agent forces the
   * `ws`-backed client even where a native implementation exists. In the
   * browser the agent is structurally impossible to honor and is silently
   * ignored here — this class has no logger of its own, so callers that want
   * to warn their users do so themselves (see `LogsStream`).
   */
  static async create(
    url: string,
    protocols?: string | string[],
    options?: WebSocketClientOptions
  ): Promise<BaseWebSocketClient> {
    const needsAgentCapableClient = Boolean(options?.agent) && !isBrowser()

    const client: BaseWebSocketClient =
      needsAgentCapableClient || !hasNativeWebSocket()
        ? new NodeWebSocketClient(url, protocols, options)
        : new BrowserWebSocketClient(url, protocols, options)

    await client.init()
    return client
  }
}
