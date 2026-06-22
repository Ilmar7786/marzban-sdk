import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnyType } from '@/common'

import { configureHttpClient } from './client'

// Hoisted so the vi.mock factories below can reference them.
const { created, axiosCreateMock, axiosRetryMock } = vi.hoisted(() => {
  const created: AnyType[] = []
  const makeFakeInstance = () => ({
    request: vi.fn().mockResolvedValue({ data: 'ok' }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  })
  return {
    created,
    axiosCreateMock: vi.fn(() => {
      const instance = makeFakeInstance()
      created.push(instance)
      return instance
    }),
    axiosRetryMock: vi.fn(),
  }
})

vi.mock('axios', () => ({ default: { create: axiosCreateMock } }))
vi.mock('axios-retry', () => ({ default: axiosRetryMock }))

const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const authService = { waitForCurrentAuth: vi.fn(), accessToken: '' } as AnyType

const makeConfig = (over: Partial<{ timeout: number; retries: number }> = {}) =>
  ({ timeout: 30_000, retries: 3, ...over }) as AnyType

describe('configureHttpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    created.length = 0
  })

  it('creates authenticated and public axios instances with the base URL and timeout', () => {
    const result = configureHttpClient('https://api.example.com', authService, makeConfig({ timeout: 5000 }), logger)

    expect(axiosCreateMock).toHaveBeenCalledTimes(2)
    expect(axiosCreateMock).toHaveBeenCalledWith({ baseURL: 'https://api.example.com', timeout: 5000 })
    expect(result.client).toBeTypeOf('function')
    expect(result.publicClient).toBeTypeOf('function')
  })

  it('sets up auth interceptors on the authenticated instance', () => {
    configureHttpClient('https://x', authService, makeConfig(), logger)

    // created[0] is the authenticated instance — interceptors are registered on it.
    expect(created[0].interceptors.request.use).toHaveBeenCalled()
    expect(created[0].interceptors.response.use).toHaveBeenCalled()
  })

  it('returns a client that delegates to the axios instance request', async () => {
    const result = configureHttpClient('https://x', authService, makeConfig(), logger)

    await result.client({ url: '/foo', method: 'GET' } as AnyType)
    expect(created[0].request).toHaveBeenCalledWith({ url: '/foo', method: 'GET' })

    await result.publicClient({ url: '/login' } as AnyType)
    expect(created[1].request).toHaveBeenCalledWith({ url: '/login' })
  })

  it('configures retry on both instances with capped exponential backoff', () => {
    configureHttpClient('https://x', authService, makeConfig({ retries: 3 }), logger)

    expect(axiosRetryMock).toHaveBeenCalledTimes(2)

    const { retries, retryDelay } = axiosRetryMock.mock.calls[0][1]
    expect(retries).toBe(3)
    expect(retryDelay(1)).toBe(1000) // 2^0 * 1000
    expect(retryDelay(2)).toBe(2000) // 2^1 * 1000
    expect(retryDelay(3)).toBe(4000) // 2^2 * 1000
    expect(retryDelay(10)).toBe(30_000) // capped at MAX_RETRY_DELAY_MS
  })
})
