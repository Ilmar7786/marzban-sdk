import type WsWebSocket from 'ws'

import { AnyType } from '@/common'

import { BaseWebSocketClient, WebSocketLike } from './base-websocket-client'

export class NodeWebSocketClient extends BaseWebSocketClient {
  private wsConstructor?: typeof WsWebSocket

  protected async prepare(): Promise<void> {
    const { default: NodeWebSocket } = await import('ws')
    this.wsConstructor = NodeWebSocket
  }

  protected createWebSocket(): WebSocketLike {
    const NodeWebSocket = this.wsConstructor!
    // The `ws` socket is EventTarget-compatible (addEventListener/send/close/
    // readyState) but its DOM typings differ, so we adapt it structurally —
    // `agent` (our structural HttpAgentLike, not ws's own Agent type) the
    // same way. `agent: undefined` when unset behaves identically to omitting it.
    return new NodeWebSocket(this.url, this.protocols, { agent: this.agent as AnyType }) as AnyType as WebSocketLike
  }
}
