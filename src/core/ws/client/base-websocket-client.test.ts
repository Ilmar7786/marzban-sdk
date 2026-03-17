import { describe, expect, it, vi } from 'vitest'

import { BaseWebSocketClient } from './base-websocket-client'

class FakeSocket {
  public readyState = 5
  public addEventListener = vi.fn()
  public send = vi.fn()
  public close = vi.fn()
}

class TestWebSocketClient extends BaseWebSocketClient {
  private socketInstance = new FakeSocket()

  protected async createWebSocket() {
    return this.socketInstance
  }

  getSocket() {
    return this.socketInstance
  }
}

describe('BaseWebSocketClient', () => {
  it('initializes socket via createWebSocket and proxies methods', async () => {
    const client = new TestWebSocketClient('wss://example.com', ['proto'])

    // Accessing readyState before init should throw because socket is not set yet.
    expect(() => client.readyState).toThrow()

    await client.init()

    // `on` should call addEventListener with typed args
    const listener = vi.fn()
    client.on('open', listener)
    expect(client.getSocket().addEventListener).toHaveBeenCalledWith('open', listener)

    // send/close should forward to the underlying socket
    client.send('hello')
    expect(client.getSocket().send).toHaveBeenCalledWith('hello')

    client.close(1000, 'bye')
    expect(client.getSocket().close).toHaveBeenCalledWith(1000, 'bye')

    // readyState should still be reflected
    expect(client.readyState).toBe(5)
  })
})
