import { describe, expect, it, vi } from 'vitest'

import type { AnyType } from '@/common'
import type { AuthManager } from '@/core/auth'
import type { Logger } from '@/core/logger'

import type { BaseWebSocketClient } from './client'
import type { LogOptions } from './logs-stream'
import { LogsStreamRetryHandler } from './logs-stream-retry'
import type { ConnectionHandle, HandleCloseConnection } from './utils/connection-handle.types'

const wsClient = {} as BaseWebSocketClient
const endpoint = '/api/core/logs'
const options: LogOptions = { onMessage: () => {} }

function createHandler(
  overrides: {
    maxRetries?: number
    retryAuth?: () => Promise<void>
    reconnect?: (endpoint: string, options: LogOptions, retryCount: number) => Promise<HandleCloseConnection>
  } = {}
) {
  const logger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const authService = {
    retryAuth: overrides.retryAuth ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as AuthManager
  const closeTracked = vi.fn()
  const reconnect = overrides.reconnect ?? vi.fn().mockResolvedValue(vi.fn())

  const handler = new LogsStreamRetryHandler({
    authService,
    logger,
    maxRetries: overrides.maxRetries ?? 3,
    closeTracked,
    reconnect,
  })

  return { handler, logger, authService, closeTracked, reconnect }
}

describe('LogsStreamRetryHandler', () => {
  it('forwards a non-403 error without closing the socket or retrying', async () => {
    const { handler, closeTracked, reconnect } = createHandler()
    const emitError = vi.fn()
    const connection: ConnectionHandle = { close: vi.fn() }

    await handler.handleError({
      wsClient,
      endpoint,
      options,
      retryCount: 0,
      event: { message: 'Network error' } as AnyType,
      emitError,
      connection,
    })

    expect(emitError).toHaveBeenCalledTimes(1)
    expect(closeTracked).not.toHaveBeenCalled()
    expect(reconnect).not.toHaveBeenCalled()
  })

  it('retries a 403 within budget: closes the failed socket, re-authenticates, and repoints connection.close', async () => {
    const newClose = vi.fn()
    const { handler, logger, authService, closeTracked, reconnect } = createHandler({
      maxRetries: 3,
      reconnect: vi.fn().mockResolvedValue(newClose),
    })
    const emitError = vi.fn()
    const connection: ConnectionHandle = { close: vi.fn() }

    await handler.handleError({
      wsClient,
      endpoint,
      options,
      retryCount: 0,
      event: { message: '403 Forbidden' } as AnyType,
      emitError,
      connection,
    })

    expect(closeTracked).toHaveBeenCalledWith(wsClient, endpoint)
    expect(authService.retryAuth).toHaveBeenCalledTimes(1)
    expect(reconnect).toHaveBeenCalledWith(endpoint, options, 1)
    expect(connection.close).toBe(newClose)
    expect(emitError).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith('Received 403 Forbidden (retry 1/3)', 'LogsStream')
  })

  it('gives up once the retry budget is exhausted, without ever logging an over-cap retry count', async () => {
    const { handler, logger, closeTracked, reconnect } = createHandler({ maxRetries: 3 })
    const emitError = vi.fn()
    const connection: ConnectionHandle = { close: vi.fn() }

    await handler.handleError({
      wsClient,
      endpoint,
      options,
      retryCount: 3,
      event: { message: '403 Forbidden' } as AnyType,
      emitError,
      connection,
    })

    expect(closeTracked).toHaveBeenCalled()
    expect(reconnect).not.toHaveBeenCalled()
    expect(emitError).toHaveBeenCalledTimes(1)
    // The off-by-one fix: once the cap is hit, no "retry N/max" line is ever printed.
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith('Maximum retry attempts reached, connection failed', null, 'LogsStream')
  })

  it('never attempts a retry when maxRetries is 0', async () => {
    const { handler, logger, reconnect } = createHandler({ maxRetries: 0 })
    const emitError = vi.fn()
    const connection: ConnectionHandle = { close: vi.fn() }

    await handler.handleError({
      wsClient,
      endpoint,
      options,
      retryCount: 0,
      event: { message: '403 Forbidden' } as AnyType,
      emitError,
      connection,
    })

    expect(reconnect).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
    expect(emitError).toHaveBeenCalledTimes(1)
  })

  it('calls emitError when re-authentication fails during a retry, and leaves connection.close untouched', async () => {
    const originalClose = vi.fn()
    const { handler, reconnect } = createHandler({
      retryAuth: vi.fn().mockRejectedValue(new Error('re-auth failed')),
    })
    const emitError = vi.fn()
    const connection: ConnectionHandle = { close: originalClose }

    await handler.handleError({
      wsClient,
      endpoint,
      options,
      retryCount: 0,
      event: { message: '403 Forbidden' } as AnyType,
      emitError,
      connection,
    })

    expect(reconnect).not.toHaveBeenCalled()
    expect(emitError).toHaveBeenCalledTimes(1)
    expect(connection.close).toBe(originalClose)
  })

  it('calls emitError when the reconnect attempt itself fails', async () => {
    const originalClose = vi.fn()
    const { handler } = createHandler({
      reconnect: vi.fn().mockRejectedValue(new Error('connect failed')),
    })
    const emitError = vi.fn()
    const connection: ConnectionHandle = { close: originalClose }

    await handler.handleError({
      wsClient,
      endpoint,
      options,
      retryCount: 0,
      event: { message: '403 Forbidden' } as AnyType,
      emitError,
      connection,
    })

    expect(emitError).toHaveBeenCalledTimes(1)
    expect(connection.close).toBe(originalClose)
  })
})
