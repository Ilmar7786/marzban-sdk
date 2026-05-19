import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthManager } from '@/core/auth'
import { HttpError, SdkError } from '@/core/errors'
import { Logger } from '@/core/logger'

import { setupAuthInterceptors } from './auth.interceptors'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})

const makeAuthManager = (overrides?: Partial<Record<string, unknown>>): AuthManager =>
  ({
    waitForCurrentAuth: vi.fn().mockResolvedValue(undefined),
    authenticate: vi.fn().mockResolvedValue(undefined),
    accessToken: 'valid-token',
    ...overrides,
  }) as unknown as AuthManager

const makeConfig = () => ({ username: 'admin', password: 'secret' })

// Captures interceptors registered on a mock AxiosInstance
const makeAxiosInstance = () => {
  let onRequestSuccess: (c: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig>
  let onRequestError: (e: unknown) => Promise<never>
  let onResponseSuccess: (r: AxiosResponse) => AxiosResponse
  let onResponseError: (e: unknown) => Promise<unknown>

  const retryFn = vi.fn()

  const instance = Object.assign(retryFn, {
    interceptors: {
      request: {
        use: vi.fn((s: typeof onRequestSuccess, e: typeof onRequestError) => {
          onRequestSuccess = s
          onRequestError = e
        }),
      },
      response: {
        use: vi.fn((s: typeof onResponseSuccess, e: typeof onResponseError) => {
          onResponseSuccess = s
          onResponseError = e
        }),
      },
    },
  }) as unknown as AxiosInstance

  return {
    instance,
    retryFn,
    req: (cfg: Partial<InternalAxiosRequestConfig> = {}) =>
      onRequestSuccess({ headers: {}, ...cfg } as InternalAxiosRequestConfig),
    reqErr: (e: unknown) => onRequestError(e),
    res: (r: Partial<AxiosResponse> = {}) => onResponseSuccess(r as AxiosResponse),
    resErr: (e: unknown) => onResponseError(e),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('setupAuthInterceptors', () => {
  let logger: Logger
  let auth: AuthManager
  let config: ReturnType<typeof makeConfig>
  let ax: ReturnType<typeof makeAxiosInstance>

  beforeEach(() => {
    vi.clearAllMocks()
    logger = makeLogger()
    auth = makeAuthManager()
    config = makeConfig()
    ax = makeAxiosInstance()
    setupAuthInterceptors(ax.instance, auth, config, logger)
  })

  // ─── setup logging ────────────────────────────────────────────────────────

  describe('setup', () => {
    it('logs debug for request interceptor registration', () => {
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('request interceptor'), 'AuthInterceptor')
    })

    it('logs debug for response interceptor registration', () => {
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('response interceptor'), 'AuthInterceptor')
    })
  })

  // ─── request interceptor — success handler ────────────────────────────────

  describe('request interceptor (success)', () => {
    it('waits for current auth before processing', async () => {
      await ax.req()
      expect(auth.waitForCurrentAuth).toHaveBeenCalled()
    })

    it('injects Authorization header when token is present', async () => {
      const result = await ax.req()
      expect(result.headers.authorization).toBe('Bearer valid-token')
    })

    it('logs debug when header is added', async () => {
      await ax.req()
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Authorization header'), 'AuthInterceptor')
    })

    it('skips header and logs warn when token is empty', async () => {
      ax = makeAxiosInstance()
      setupAuthInterceptors(ax.instance, makeAuthManager({ accessToken: '' }), config, logger)
      const result = await ax.req()
      expect(result.headers.authorization).toBeUndefined()
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('No access token'), 'AuthInterceptor')
    })
  })

  // ─── request interceptor — error handler ─────────────────────────────────

  describe('request interceptor (error)', () => {
    it('re-throws SdkError as-is', async () => {
      const err = new SdkError({ code: 'AUTH_FAILED', message: 'auth failed' })
      await expect(ax.reqErr(err)).rejects.toBe(err)
    })

    it('wraps non-SdkError in HttpError', async () => {
      await expect(ax.reqErr(new Error('network'))).rejects.toBeInstanceOf(HttpError)
    })

    it('logs error before handling', async () => {
      const err = new Error('oops')
      await ax.reqErr(err).catch(() => {})
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Request interceptor error'),
        err,
        'AuthInterceptor'
      )
    })
  })

  // ─── response interceptor — success handler ───────────────────────────────

  describe('response interceptor (success)', () => {
    it('returns the response unchanged', async () => {
      const response = { data: { id: 1 }, status: 200, statusText: 'OK' }
      expect(await ax.res(response)).toEqual(response)
    })
  })

  // ─── response interceptor — 401 handling ─────────────────────────────────

  describe('response interceptor (401)', () => {
    it('calls authenticate with stored credentials on 401', async () => {
      await ax.resErr({ response: { status: 401 }, config: { headers: {} } }).catch(() => {})
      expect(auth.authenticate).toHaveBeenCalledWith('admin', 'secret')
    })

    it('logs warn before re-authenticating', async () => {
      await ax.resErr({ response: { status: 401 }, config: { headers: {} } }).catch(() => {})
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('401'), 'AuthInterceptor')
    })

    it('sets sent=true on retryConfig to prevent infinite loops', async () => {
      const retryConfig = { headers: {} }
      await ax.resErr({ response: { status: 401 }, config: retryConfig }).catch(() => {})
      expect(retryConfig).toHaveProperty('sent', true)
    })

    it('does not re-authenticate when sent=true (already retried)', async () => {
      await ax.resErr({ response: { status: 401 }, config: { headers: {}, sent: true } }).catch(() => {})
      expect(auth.authenticate).not.toHaveBeenCalled()
    })

    it('retries the request with updated token after successful re-auth', async () => {
      ax.retryFn.mockResolvedValue({ data: 'retried', status: 200 })
      const result = await ax.resErr({ response: { status: 401 }, config: { headers: {} } })
      expect(ax.retryFn).toHaveBeenCalled()
      expect(result).toEqual({ data: 'retried', status: 200 })
    })

    it('adds new token to retry config headers', async () => {
      ax.retryFn.mockResolvedValue({})
      const retryConfig = { headers: {} }
      await ax.resErr({ response: { status: 401 }, config: retryConfig }).catch(() => {})
      expect(retryConfig.headers).toHaveProperty('authorization', 'Bearer valid-token')
    })

    it('rejects with HttpError when token is empty after re-auth', async () => {
      ax = makeAxiosInstance()
      setupAuthInterceptors(ax.instance, makeAuthManager({ accessToken: '' }), config, logger)
      await expect(ax.resErr({ response: { status: 401 }, config: { headers: {} } })).rejects.toBeInstanceOf(HttpError)
    })

    it('logs error when token is empty after re-auth', async () => {
      ax = makeAxiosInstance()
      setupAuthInterceptors(ax.instance, makeAuthManager({ accessToken: '' }), config, logger)
      await ax.resErr({ response: { status: 401 }, config: { headers: {} } }).catch(() => {})
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('No access token'), null, 'AuthInterceptor')
    })

    it('re-throws SdkError from re-auth failure as-is', async () => {
      const sdkErr = new SdkError({ code: 'AUTH_FAILED', message: 'auth failed' })
      ax = makeAxiosInstance()
      setupAuthInterceptors(
        ax.instance,
        makeAuthManager({ authenticate: vi.fn().mockRejectedValue(sdkErr), accessToken: '' }),
        config,
        logger
      )
      await expect(ax.resErr({ response: { status: 401 }, config: { headers: {} } })).rejects.toBe(sdkErr)
    })

    it('wraps non-SdkError from re-auth failure in HttpError', async () => {
      ax = makeAxiosInstance()
      setupAuthInterceptors(
        ax.instance,
        makeAuthManager({ authenticate: vi.fn().mockRejectedValue(new Error('network')), accessToken: '' }),
        config,
        logger
      )
      await expect(ax.resErr({ response: { status: 401 }, config: { headers: {} } })).rejects.toBeInstanceOf(HttpError)
    })
  })

  // ─── response interceptor — non-401 errors ────────────────────────────────

  describe('response interceptor (non-401)', () => {
    it('re-throws SdkError as-is', async () => {
      const err = new SdkError({ code: 'NETWORK_HTTP_ERROR', message: 'http error' })
      await expect(ax.resErr(err)).rejects.toBe(err)
    })

    it('wraps non-SdkError in HttpError', async () => {
      await expect(ax.resErr(new Error('connection reset'))).rejects.toBeInstanceOf(HttpError)
    })

    it('treats 403 as a non-401 error and wraps in HttpError', async () => {
      await expect(ax.resErr({ response: { status: 403 }, config: { headers: {} } })).rejects.toBeInstanceOf(HttpError)
    })
  })
})
