import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnyType } from '@/common'

// We intentionally import within tests to allow mocking `ws` and the global
// `WebSocket` dynamically.

describe('WebSocketClient', () => {
  // Node 21+ exposes a native global WebSocket; snapshot it so each test can
  // control whether a native implementation is "present".
  const originalWebSocket = (globalThis as AnyType).WebSocket

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    ;(globalThis as AnyType).WebSocket = originalWebSocket
    delete (globalThis as AnyType).window
  })

  it('falls back to NodeWebSocketClient (ws package) when no native WebSocket exists', async () => {
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

    // Simulate an older runtime without a native WebSocket.
    delete (globalThis as AnyType).WebSocket
    vi.doMock('ws', () => ({ default: FakeWs }))

    const { WebSocketClient } = await import('./websocket-client')
    const client = await WebSocketClient.create('wss://example.com', ['protocol1'])

    expect(createdUrl).toBe('wss://example.com')
    expect(createdProtocols).toEqual(['protocol1'])
    expect(client.constructor.name).toBe('NodeWebSocketClient')

    client.send('payload')
    expect((client as AnyType).socket.send).toHaveBeenCalledWith('payload')

    client.close(1000, 'reason')
    expect((client as AnyType).socket.close).toHaveBeenCalledWith(1000, 'reason')

    expect(client.readyState).toBe(1)
  })

  it('uses BrowserWebSocketClient when a native WebSocket is available', async () => {
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

    // Provide a native global WebSocket (covers browser, Worker, Deno, Bun, Node 21+).
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

  it('forces the ws-backed client when an agent is configured, even with a native WebSocket available, and forwards the agent to ws', async () => {
    class FakeWebSocket {
      public readyState = 1
      addEventListener = vi.fn()
    }
    // Native WebSocket present (e.g. Node 21+) — normally preferred.
    ;(globalThis as AnyType).WebSocket = FakeWebSocket

    let receivedOptions: AnyType
    class FakeWs {
      public readyState = 1
      addEventListener = vi.fn()
      constructor(
        public url: string,
        public protocols: string | string[] | undefined,
        options: AnyType
      ) {
        receivedOptions = options
      }
    }
    vi.doMock('ws', () => ({ default: FakeWs }))

    const { WebSocketClient } = await import('./websocket-client')
    const agent = { destroy: vi.fn() }
    const client = await WebSocketClient.create('wss://example.com', undefined, { agent })

    expect(client.constructor.name).toBe('NodeWebSocketClient')
    expect(receivedOptions).toEqual({ agent })
  })

  it('forwards headers to the ws-backed client', async () => {
    // No native WebSocket — the simplest way to force NodeWebSocketClient
    // without an agent, so this test isolates headers specifically.
    delete (globalThis as AnyType).WebSocket

    let receivedOptions: AnyType
    class FakeWs {
      public readyState = 1
      addEventListener = vi.fn()
      constructor(
        public url: string,
        public protocols: string | string[] | undefined,
        options: AnyType
      ) {
        receivedOptions = options
      }
    }
    vi.doMock('ws', () => ({ default: FakeWs }))

    const { WebSocketClient } = await import('./websocket-client')
    const headers = { Authorization: 'Bearer token' }
    const client = await WebSocketClient.create('wss://example.com', undefined, { headers })

    expect(client.constructor.name).toBe('NodeWebSocketClient')
    expect(receivedOptions).toEqual({ headers })
  })

  it('cannot forward headers to the browser-backed client — the native WebSocket constructor has no options parameter', async () => {
    let receivedArgs: unknown[] = []
    class FakeWebSocket {
      public readyState = 1
      addEventListener = vi.fn()
      constructor(...args: unknown[]) {
        receivedArgs = args
      }
    }
    ;(globalThis as AnyType).WebSocket = FakeWebSocket

    const { WebSocketClient } = await import('./websocket-client')
    const headers = { Authorization: 'Bearer token' }
    const client = await WebSocketClient.create('wss://example.com', 'proto', { headers })

    expect(client.constructor.name).toBe('BrowserWebSocketClient')
    // Only (url, protocols) ever reach the native constructor — structurally
    // impossible for headers to leak through, not just unused.
    expect(receivedArgs).toEqual(['wss://example.com', 'proto'])
  })

  it('ignores the agent and still uses BrowserWebSocketClient in the browser', async () => {
    class FakeWebSocket {
      public readyState = 1
      addEventListener = vi.fn()
    }
    ;(globalThis as AnyType).WebSocket = FakeWebSocket
    ;(globalThis as AnyType).window = { document: {} }

    const { WebSocketClient } = await import('./websocket-client')
    const agent = { destroy: vi.fn() }
    const client = await WebSocketClient.create('wss://example.com', undefined, { agent })

    expect(client.constructor.name).toBe('BrowserWebSocketClient')
  })

  it('uses BrowserWebSocketClient when no agent is configured, regardless of environment', async () => {
    class FakeWebSocket {
      public readyState = 1
      addEventListener = vi.fn()
    }
    ;(globalThis as AnyType).WebSocket = FakeWebSocket

    const { WebSocketClient } = await import('./websocket-client')
    const client = await WebSocketClient.create('wss://example.com')

    expect(client.constructor.name).toBe('BrowserWebSocketClient')
  })

  it('resolve() picks the client without connecting it, leaving create() as resolve() + init()', async () => {
    class FakeWebSocket {
      public readyState = 1
      addEventListener = vi.fn()
    }
    ;(globalThis as AnyType).WebSocket = FakeWebSocket

    const { WebSocketClient } = await import('./websocket-client')
    const client = WebSocketClient.resolve('wss://example.com')

    expect(client.constructor.name).toBe('BrowserWebSocketClient')
    expect(() => client.readyState).toThrow(TypeError)

    await client.init()
    expect(client.readyState).toBe(1)
  })
})
