import { afterEach, describe, expect, it, vi } from 'vitest'

import { AnyType } from '@/common'

// We intentionally import within tests to allow mocking `ws` and `window` dynamically.

describe('WebSocketClient', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    delete (globalThis as AnyType).window
  })

  it('uses NodeWebSocketClient when window is undefined', async () => {
    let createdUrl = ''
    let createdProtocols: string | string[] | undefined

    class FakeWs {
      public readyState = 1
      constructor(url: string, protocols?: string | string[]) {
        createdUrl = url
        createdProtocols = protocols
      }
      send = vi.fn()
      close = vi.fn()
      addEventListener = vi.fn()
    }

    vi.doMock('ws', () => ({ default: FakeWs }))

    const { WebSocketClient } = await import('./websocket-client')

    const client = await WebSocketClient.create('wss://example.com', ['protocol1'])

    expect(createdUrl).toBe('wss://example.com')
    expect(createdProtocols).toEqual(['protocol1'])

    // The actual instance should be the NodeWebSocketClient implementation.
    expect(client.constructor.name).toBe('NodeWebSocketClient')

    client.send('payload')
    expect((client as AnyType).socket.send).toHaveBeenCalledWith('payload')

    client.close(1000, 'reason')
    expect((client as AnyType).socket.close).toHaveBeenCalledWith(1000, 'reason')

    expect(client.readyState).toBe(1)
  })

  it('uses BrowserWebSocketClient when window.WebSocket is available', async () => {
    class FakeWebSocket {
      public readyState = 2
      public protocol?: string | string[]
      constructor(
        public url: string,
        protocols?: string | string[]
      ) {
        this.protocol = protocols
      }
      send = vi.fn()
      close = vi.fn()
      addEventListener = vi.fn()
    }

    // Create a fake global window + global WebSocket.
    ;(globalThis as AnyType).window = { WebSocket: FakeWebSocket }
    ;(globalThis as AnyType).WebSocket = FakeWebSocket

    const { WebSocketClient } = await import('./websocket-client')

    const client = await WebSocketClient.create('wss://example.com/ws', 'proto')

    expect(client.constructor.name).toBe('BrowserWebSocketClient')
    expect((client as AnyType).socket.constructor.name).toBe('FakeWebSocket')
    expect((client as AnyType).socket.url).toBe('wss://example.com/ws')
    expect((client as AnyType).socket.protocol).toBe('proto')

    client.send('x')
    expect((client as AnyType).socket.send).toHaveBeenCalledWith('x')

    client.close()
    expect((client as AnyType).socket.close).toHaveBeenCalled()

    expect(client.readyState).toBe(2)
  })
})
