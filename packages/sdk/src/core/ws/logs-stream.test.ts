import { describe, expect, it, vi } from 'vitest'

import type { AuthManager } from '@/core/auth'
import type { Logger } from '@/core/logger'

import { LogsStream } from './logs-stream'

/**
 * Registry-level behavior that needs no socket at all. The connection
 * lifecycle itself is covered by `log-stream.test.ts` (fake socket) and
 * `logs-stream.server.test.ts` (real `ws.Server`).
 */
vi.mock('@/common', async importOriginal => {
  const actual = await importOriginal<typeof import('@/common')>()
  return { ...actual, isBrowser: vi.fn(() => false) }
})

const { isBrowser } = await import('@/common')
const isBrowserMock = vi.mocked(isBrowser)

function createLogsStream(httpsAgent?: { destroy: () => void }) {
  const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger

  const stream = new LogsStream({
    basePath: 'https://panel.example.com',
    authService: {} as AuthManager,
    logger,
    httpsAgent,
  })

  return { stream, logger }
}

describe('LogsStream', () => {
  it('warns that httpsAgent is inert in the browser', () => {
    isBrowserMock.mockReturnValue(true)

    const { logger } = createLogsStream({ destroy: () => {} })

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('httpsAgent is ignored in the browser'),
      'LogsStream'
    )
  })

  it('does not warn in the browser when no httpsAgent was configured', () => {
    isBrowserMock.mockReturnValue(true)

    const { logger } = createLogsStream()

    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('does not warn outside the browser, where the agent is honored', () => {
    isBrowserMock.mockReturnValue(false)

    const { logger } = createLogsStream({ destroy: () => {} })

    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('closeAllConnections() is safe to call with nothing open', () => {
    isBrowserMock.mockReturnValue(false)
    const { stream, logger } = createLogsStream()

    expect(() => stream.closeAllConnections()).not.toThrow()
    expect(logger.info).toHaveBeenCalledWith('Closing 0 active WebSocket connections', 'LogsStream')
  })
})
