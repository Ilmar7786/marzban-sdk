import { AnyType } from '@/common'

import { BaseWebSocketClient, WebSocketLike } from './base-websocket-client'

export class NodeWebSocketClient extends BaseWebSocketClient {
  protected async createWebSocket(): Promise<WebSocketLike> {
    const { default: NodeWebSocket } = await import('ws')
    // The `ws` socket is EventTarget-compatible (addEventListener/send/close/
    // readyState) but its DOM typings differ, so we adapt it structurally.
    return new NodeWebSocket(this.url, this.protocols) as AnyType as WebSocketLike
  }
}
