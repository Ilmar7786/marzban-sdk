import { describe, expect, it, vi } from 'vitest'

import type { AnyType } from '@/common'

import { BaseWebSocketClient, type WebSocketClientOptions, type WebSocketLike } from './base-websocket-client'

class FakeSocket implements WebSocketLike {
  readyState = 5
  send = vi.fn()
  close = vi.fn()

  private listeners = new Map<string, Set<(event: AnyType) => void>>()

  constructor(dispatchOnConstruct?: { type: string; event: AnyType }) {
    if (dispatchOnConstruct) {
      // Real transports never dispatch synchronously from their own
      // constructor — networking is inherently async — but they dispatch as
      // early as the very next microtask. That's exactly what a listener
      // attached after an `await` between construction and registration
      // would miss (see issue #86).
      queueMicrotask(() => this.dispatch(dispatchOnConstruct.type, dispatchOnConstruct.event))
    }
  }

  addEventListener(type: string, listener: (event: AnyType) => void): void {
    const listenersForType = this.listeners.get(type) ?? new Set()
    listenersForType.add(listener)
    this.listeners.set(type, listenersForType)
  }

  private dispatch(type: string, event: AnyType): void {
    this.listeners.get(type)?.forEach(listener => listener(event))
  }
}

class TestWebSocketClient extends BaseWebSocketClient {
  private socketInstance?: FakeSocket

  constructor(
    url: string,
    protocols?: string | string[],
    options?: WebSocketClientOptions,
    private readonly dispatchOnConstruct?: { type: string; event: AnyType }
  ) {
    super(url, protocols, options)
  }

  protected createWebSocket(): WebSocketLike {
    this.socketInstance = new FakeSocket(this.dispatchOnConstruct)
    return this.socketInstance
  }

  getSocket() {
    return this.socketInstance
  }

  getAgent() {
    return this.agent
  }
}

class PrepareOrderWebSocketClient extends BaseWebSocketClient {
  calls: string[] = []

  protected async prepare(): Promise<void> {
    this.calls.push('prepare')
  }

  protected createWebSocket(): WebSocketLike {
    this.calls.push('createWebSocket')
    return new FakeSocket()
  }
}

describe('BaseWebSocketClient', () => {
  it('throws when send/readyState is accessed before init()', () => {
    const client = new TestWebSocketClient('wss://example.com')

    expect(() => client.readyState).toThrow(TypeError)
    expect(() => client.send('hello')).toThrow(TypeError)
  })

  it('awaits prepare() before constructing the socket', async () => {
    const client = new PrepareOrderWebSocketClient('wss://example.com')

    await client.init()

    expect(client.calls).toEqual(['prepare', 'createWebSocket'])
  })

  it('delivers an event dispatched right after construction to a listener registered before init()', async () => {
    const event = { type: 'error' }
    const client = new TestWebSocketClient('wss://example.com', undefined, undefined, { type: 'error', event })
    const listener = vi.fn()

    client.on('error', listener)
    await client.init()

    expect(listener).toHaveBeenCalledWith(event)
  })

  it('attaches a listener registered after init() directly, without buffering', async () => {
    const client = new TestWebSocketClient('wss://example.com')
    await client.init()

    const addEventListener = vi.spyOn(client.getSocket()!, 'addEventListener')
    const listener = vi.fn()
    client.on('message', listener)

    expect(addEventListener).toHaveBeenCalledWith('message', listener)
  })

  it('defers close() called before init() and applies it once the socket exists', async () => {
    const client = new TestWebSocketClient('wss://example.com')

    client.close(1000, 'bye')
    await client.init()

    expect(client.getSocket()!.close).toHaveBeenCalledWith(1000, 'bye')
  })

  it('proxies send/close and reflects readyState once initialized', async () => {
    const client = new TestWebSocketClient('wss://example.com', ['proto'])
    await client.init()

    client.send('hello')
    expect(client.getSocket()!.send).toHaveBeenCalledWith('hello')

    client.close(1000, 'bye')
    expect(client.getSocket()!.close).toHaveBeenCalledWith(1000, 'bye')

    expect(client.readyState).toBe(5)
  })

  it('stores options.agent for subclasses to use, and leaves it undefined when not provided', () => {
    const agent = { destroy: vi.fn() }
    expect(new TestWebSocketClient('wss://example.com', undefined, { agent }).getAgent()).toBe(agent)
    expect(new TestWebSocketClient('wss://example.com').getAgent()).toBeUndefined()
  })
})
