import { vi } from 'vitest'

export type WsTransportName = 'native' | 'ws-package'

/**
 * WS-module tests need to prove behavior holds on both transports
 * `WebSocketClient.create` can pick (see `core/ws/client/websocket-client.ts`):
 * the native global `WebSocket` (browsers, Deno, Bun, Node 21+) and the `ws`
 * package fallback (older Node, or a configured `httpsAgent`). Vitest's
 * `environment: 'node'` always has a native `WebSocket`, so exercising the
 * `ws`-package path requires removing it for the duration of a test.
 */
export const WS_TRANSPORTS: readonly WsTransportName[] = ['native', 'ws-package']

/**
 * Selects which transport `WebSocketClient.create` resolves to for the
 * duration of the current test. Call inside a `beforeEach`/test body;
 * `vi.unstubAllGlobals()` in an `afterEach` restores the native global.
 */
export function selectWsTransport(name: WsTransportName): void {
  if (name === 'ws-package') {
    vi.stubGlobal('WebSocket', undefined)
  }
}
