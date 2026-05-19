import type { Mock } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnyType } from '@/common/types'

import type { BaseWebSocketClient } from './client'
import { WebSocketClient } from './client'
import { LogsStream } from './logs-stream'
import { configurationUrlWs } from './utils'

vi.mock('./client', () => ({
  WebSocketClient: {
    create: vi.fn(),
  },
}))

const mockCreate = (WebSocketClient as unknown as { create: Mock<(url: string) => Promise<BaseWebSocketClient>> })
  .create

type FakeWebSocketClient = {
  on: (event: string, listener: (payload: AnyType) => AnyType) => void
  close: ReturnType<typeof vi.fn>
  trigger: (event: string, payload?: AnyType) => Promise<AnyType> | AnyType
}

function createFakeWebSocketClient(): FakeWebSocketClient {
  const handlers = new Map<string, (payload: AnyType) => AnyType>()

  const client: FakeWebSocketClient = {
    on(event, listener) {
      handlers.set(event, listener)
    },
    close: vi.fn(() => {
      const handler = handlers.get('close')
      if (handler) {
        handler(undefined)
      }
    }),
    async trigger(event, payload) {
      const handler = handlers.get(event)
      if (!handler) {
        throw new Error(`No handler registered for event: ${event}`)
      }
      return handler(payload)
    },
  }

  return client
}

describe('LogsStream', () => {
  const basePath = 'https://api.example.com'

  let authService: AnyType
  let logger: AnyType

  beforeEach(() => {
    mockCreate.mockReset()

    authService = {
      waitForCurrentAuth: vi.fn().mockResolvedValue(undefined),
      retryAuth: vi.fn().mockResolvedValue(undefined),
      accessToken: 'initial-token',
    }

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }
  })

  it('sends messages from WebSocket to the provided callback', async () => {
    const wsClient = createFakeWebSocketClient()
    mockCreate.mockResolvedValueOnce(wsClient as unknown as BaseWebSocketClient)

    const stream = new LogsStream(basePath, authService, logger)
    const onMessage = vi.fn()
    const onError = vi.fn()

    const close = await stream.connectByCore({ interval: 1, onMessage, onError })

    const expectedUrl = configurationUrlWs({
      basePath,
      endpoint: '/api/core/logs',
      token: authService.accessToken,
      interval: 1,
    })

    expect(mockCreate).toHaveBeenCalledWith(expectedUrl)

    const payload = { foo: 'bar' }
    await wsClient.trigger('message', { data: payload })
    expect(onMessage).toHaveBeenCalledWith(payload)

    // Cover the open handler for increased coverage.
    await wsClient.trigger('open')
    expect(logger.info).toHaveBeenCalledWith(`WebSocket connection established: /api/core/logs`, 'LogsStream')

    close()
    expect(wsClient.close).toHaveBeenCalled()
  })

  it('re-authenticates and reconnects on 403 errors without leaking connections', async () => {
    const firstWsClient = createFakeWebSocketClient()
    const secondWsClient = createFakeWebSocketClient()

    mockCreate
      .mockResolvedValueOnce(firstWsClient as unknown as BaseWebSocketClient)
      .mockResolvedValueOnce(secondWsClient as unknown as BaseWebSocketClient)

    authService.retryAuth.mockImplementation(async () => {
      authService.accessToken = 'refreshed-token'
    })

    const stream = new LogsStream(basePath, authService, logger)

    const onMessage = vi.fn()
    const onError = vi.fn()

    await stream.connectByCore({ interval: 1, onMessage, onError })

    // Simulate a 403 error; should close the first connection and reconnect.
    await firstWsClient.trigger('error', { message: '403 Forbidden' })

    expect(authService.retryAuth).toHaveBeenCalled()

    // Ensure the new connection uses the refreshed token.
    const expectedUrl = configurationUrlWs({
      basePath,
      endpoint: '/api/core/logs',
      token: 'refreshed-token',
      interval: 1,
    })
    expect(mockCreate).toHaveBeenLastCalledWith(expectedUrl)

    // Verify we don't keep around the failing connection.
    expect((stream as AnyType).activeConnections.size).toBe(1)
  })

  it('calls onError after reaching max retry attempts', async () => {
    const firstWsClient = createFakeWebSocketClient()
    const secondWsClient = createFakeWebSocketClient()

    mockCreate
      .mockResolvedValueOnce(firstWsClient as unknown as BaseWebSocketClient)
      .mockResolvedValueOnce(secondWsClient as unknown as BaseWebSocketClient)

    const stream = new LogsStream(basePath, authService, logger)

    // Force max retries to 1 so we can assert behavior deterministically.
    ;(stream as AnyType).maxRetries = 1

    const onMessage = vi.fn()
    const onError = vi.fn()

    await stream.connectByCore({ interval: 1, onMessage, onError })

    // First 403 triggers a retry.
    await firstWsClient.trigger('error', { message: '403 Forbidden' })

    // Second 403 should reach the retry cap and invoke onError.
    await secondWsClient.trigger('error', { message: '403 Forbidden' })

    expect(onError).toHaveBeenCalled()
    expect((stream as AnyType).activeConnections.size).toBe(0)
  })

  it('re-authenticates when token is missing before connecting', async () => {
    const wsClient = createFakeWebSocketClient()
    mockCreate.mockResolvedValueOnce(wsClient as unknown as BaseWebSocketClient)

    authService.accessToken = ''
    authService.retryAuth.mockImplementation(async () => {
      authService.accessToken = 'new-token'
    })

    const stream = new LogsStream(basePath, authService, logger)
    const onMessage = vi.fn()
    const onError = vi.fn()

    await stream.connectByCore({ interval: 1, onMessage, onError })

    expect(authService.retryAuth).toHaveBeenCalled()

    const expectedUrl = configurationUrlWs({
      basePath,
      endpoint: '/api/core/logs',
      token: 'new-token',
      interval: 1,
    })
    expect(mockCreate).toHaveBeenCalledWith(expectedUrl)
  })

  it('forwards non-403 errors through onError and does not reconnect', async () => {
    const wsClient = createFakeWebSocketClient()
    mockCreate.mockResolvedValueOnce(wsClient as unknown as BaseWebSocketClient)

    const stream = new LogsStream(basePath, authService, logger)
    const onMessage = vi.fn()
    const onError = vi.fn()

    await stream.connectByCore({ interval: 1, onMessage, onError })

    await wsClient.trigger('error', { message: 'Network error' })

    expect(onError).toHaveBeenCalled()
    // Should not attempt to reconnect.
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect((stream as AnyType).activeConnections.size).toBe(1)
  })

  it('works when onError is not provided and uses default interval', async () => {
    const wsClient = createFakeWebSocketClient()
    mockCreate.mockResolvedValueOnce(wsClient as unknown as BaseWebSocketClient)

    const stream = new LogsStream(basePath, authService, logger)
    const onMessage = vi.fn()

    await stream.connectByCore({ onMessage })

    const expectedUrl = configurationUrlWs({
      basePath,
      endpoint: '/api/core/logs',
      token: authService.accessToken,
      interval: 1,
    })

    expect(mockCreate).toHaveBeenCalledWith(expectedUrl)

    await wsClient.trigger('error', { message: 'Network error' })
    // No error handler provided, so no throw and no reconnect.
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('handles error events without a message property', async () => {
    const wsClient = createFakeWebSocketClient()
    mockCreate.mockResolvedValueOnce(wsClient as unknown as BaseWebSocketClient)

    const stream = new LogsStream(basePath, authService, logger)
    const onMessage = vi.fn()
    const onError = vi.fn()

    await stream.connectByCore({ onMessage, onError })

    await wsClient.trigger('error', {})

    expect(onError).toHaveBeenCalled()
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('removes connections when closed and supports closeAllConnections', async () => {
    const wsClient1 = createFakeWebSocketClient()
    const wsClient2 = createFakeWebSocketClient()

    mockCreate
      .mockResolvedValueOnce(wsClient1 as unknown as BaseWebSocketClient)
      .mockResolvedValueOnce(wsClient2 as unknown as BaseWebSocketClient)

    const stream = new LogsStream(basePath, authService, logger)

    const onMessage = vi.fn()
    const onError = vi.fn()

    await stream.connectByCore({ interval: 1, onMessage, onError })
    await stream.connectByNode('node-1', { interval: 1, onMessage, onError })

    // Close first connection.
    await wsClient1.trigger('close')
    expect((stream as AnyType).activeConnections.size).toBe(1)

    stream.closeAllConnections()
    expect(wsClient2.close).toHaveBeenCalled()
    expect((stream as AnyType).activeConnections.size).toBe(0)
  })
})
