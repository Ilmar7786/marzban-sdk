import { hasNativeWebSocket, isBrowser } from '@/common'

import type { WebSocketClientOptions } from './base-websocket-client'

export type WsTransportKind = 'native' | 'ws-package'

/**
 * Which transport {@link WebSocketClient.resolve} will pick for these
 * options — computed independently of any URL, so a caller that needs to
 * decide something about the URL or headers based on the transport (see
 * `LogStream.attemptOnce`) can ask this *before* building either, on the
 * exact same inputs `resolve()` itself uses. One function, two call sites:
 * they can never disagree.
 */
export const selectWsTransportKind = (options?: WebSocketClientOptions): WsTransportKind => {
  const needsAgentCapableClient = Boolean(options?.agent) && !isBrowser()

  return needsAgentCapableClient || !hasNativeWebSocket() ? 'ws-package' : 'native'
}

/**
 * Only the `ws` package can set request headers on the WebSocket upgrade —
 * the native `WebSocket` constructor (browsers, Deno, Bun, Node.js 21+) has
 * no headers option at all. A platform limit, not a gap in this SDK.
 */
export const transportSupportsHeaders = (kind: WsTransportKind): boolean => kind === 'ws-package'
