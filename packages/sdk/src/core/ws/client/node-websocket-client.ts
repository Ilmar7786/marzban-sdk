import { AnyType } from '@/common'

import { BaseWebSocketClient, WebSocketLike } from './base-websocket-client'

export class NodeWebSocketClient extends BaseWebSocketClient {
  protected async createWebSocket(): Promise<WebSocketLike> {
    const { default: NodeWebSocket } = await import('ws')
    // The `ws` socket is EventTarget-compatible (addEventListener/send/close/
    // readyState) but its DOM typings differ, so we adapt it structurally —
    // `agent` (our structural HttpAgentLike, not ws's own Agent type) the
    // same way. `agent: undefined` when unset behaves identically to omitting it.
    return new NodeWebSocket(this.url, this.protocols, { agent: this.agent as AnyType }) as AnyType as WebSocketLike
  }
}
