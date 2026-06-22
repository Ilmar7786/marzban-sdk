import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnyType } from '@/common'

import { HttpError } from './errors'
import { LoggerConfig } from './logger'

// ─── Shared mock references ───────────────────────────────────────────────────

let mockAuthInstance: MockAuthManager
let mockLogsStreamInstance: MockLogsStream
let mockWebhookInstance: MockWebhookManager

// ─── Dependency mocks ─────────────────────────────────────────────────────────

const mockValidateConfig = vi.fn((c: AnyType) => c)

/**
 * createLogger is called TWICE per createMarzbanSDK call:
 *   1. inside the factory function itself
 *   2. inside the MarzbanSDK constructor
 * Keep a stable return value so both callers get a usable logger.
 */
const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const mockCreateLogger = vi.fn(() => mockLogger)

const mockAuthManagerCtor = vi.fn()
class MockAuthManager {
  isAuthenticating = false
  authPromise: Promise<void> | null = null
  accessToken = 'mock-token'

  authenticate = vi.fn().mockResolvedValue(undefined)
  waitForCurrentAuth = vi.fn().mockResolvedValue(undefined)
  setPublicClient = vi.fn()

  constructor(storage: AnyType, logger: AnyType) {
    mockAuthManagerCtor(storage, logger)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockAuthInstance = this
  }
}

const mockHttpClient = { request: vi.fn() }
const mockPublicClient = { request: vi.fn() }
const mockConfigureHttpClient = vi.fn(() => ({
  client: mockHttpClient,
  publicClient: mockPublicClient,
}))

const mockLogsStreamCtor = vi.fn()
class MockLogsStream {
  closeAllConnections = vi.fn()

  constructor(baseUrl: string, auth: AnyType, logger: AnyType, maxRetries?: number) {
    mockLogsStreamCtor(baseUrl, auth, logger, maxRetries)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockLogsStreamInstance = this
  }
}

const mockWebhookManagerCtor = vi.fn()
class MockWebhookManager {
  close = vi.fn()

  constructor(opts: AnyType) {
    mockWebhookManagerCtor(opts)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockWebhookInstance = this
  }
}

// ─── vi.mock calls (hoisted before any imports) ───────────────────────────────

vi.mock('@/gen/api', () => ({
  adminApi: vi.fn(),
  coreApi: vi.fn(),
  nodeApi: vi.fn(),
  userApi: vi.fn(),
  systemApi: vi.fn(),
  subscriptionApi: vi.fn(),
  userTemplateApi: vi.fn(),
}))

vi.mock('@/config', () => ({ validateConfig: mockValidateConfig }))
vi.mock('./logger', () => ({ createLogger: mockCreateLogger }))
vi.mock('./auth', () => ({ AuthManager: MockAuthManager }))
vi.mock('./http', () => ({ configureHttpClient: mockConfigureHttpClient }))
vi.mock('./ws', () => ({ LogsStream: MockLogsStream }))
vi.mock('./webhook', () => ({ WebhookManager: MockWebhookManager }))

// Dynamic import AFTER vi.mock so the module picks up the mocked deps.
const { MarzbanSDK, createMarzbanSDK } = await import('./MarzbanSDK')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_CONFIG = { baseUrl: 'https://api.example.com', username: 'admin', password: 's3cr3t' }

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MarzbanSDK', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Restore default return values that clearAllMocks wipes out.
    mockValidateConfig.mockImplementation((c: AnyType) => c)
    mockCreateLogger.mockReturnValue(mockLogger)
    mockConfigureHttpClient.mockReturnValue({ client: mockHttpClient, publicClient: mockPublicClient })
  })

  // ── Construction ────────────────────────────────────────────────────────────

  describe('constructor – config & logger', () => {
    it('validates config using validateConfig', () => {
      new MarzbanSDK(BASE_CONFIG)
      expect(mockValidateConfig).toHaveBeenCalledWith(BASE_CONFIG)
    })

    it('uses the validated config (i.e. the return value of validateConfig)', () => {
      const transformed = { ...BASE_CONFIG, baseUrl: 'https://transformed' }
      mockValidateConfig.mockReturnValueOnce(transformed)

      new MarzbanSDK(BASE_CONFIG)

      // configureHttpClient should receive the *transformed* baseUrl
      expect(mockConfigureHttpClient).toHaveBeenCalledWith(
        'https://transformed',
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })

    it('creates a logger passing config.logger', () => {
      const loggerConfig: LoggerConfig = { level: 'debug' }
      new MarzbanSDK({ ...BASE_CONFIG, logger: loggerConfig })
      expect(mockCreateLogger).toHaveBeenCalledWith(loggerConfig)
    })
  })

  describe('constructor – AuthManager', () => {
    it('instantiates AuthManager with a storage object derived from config', () => {
      new MarzbanSDK({ ...BASE_CONFIG, token: 'existing-token' })

      expect(mockAuthManagerCtor).toHaveBeenCalledWith(
        { username: 'admin', password: 's3cr3t', accessToken: 'existing-token' },
        expect.any(Object) // logger
      )
    })

    it('passes undefined accessToken when config.token is absent', () => {
      new MarzbanSDK(BASE_CONFIG)

      expect(mockAuthManagerCtor).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: undefined }),
        expect.anything()
      )
    })

    it('registers the public HTTP client on the auth service', () => {
      new MarzbanSDK(BASE_CONFIG)
      expect(mockAuthInstance.setPublicClient).toHaveBeenCalledWith(mockPublicClient)
    })
  })

  describe('constructor – HTTP client', () => {
    it('calls configureHttpClient with baseUrl, authService, full config, and logger', () => {
      new MarzbanSDK(BASE_CONFIG)

      expect(mockConfigureHttpClient).toHaveBeenCalledWith(
        BASE_CONFIG.baseUrl,
        expect.any(MockAuthManager),
        expect.objectContaining(BASE_CONFIG),
        expect.any(Object)
      )
    })
  })

  describe('constructor – API modules', () => {
    it('instantiates every API class with the authenticated http client', async () => {
      const { adminApi, coreApi, nodeApi, userApi, systemApi, subscriptionApi, userTemplateApi } =
        await import('@/gen/api')

      new MarzbanSDK(BASE_CONFIG)

      const expectCalledWithClient = (ctor: AnyType) => expect(ctor).toHaveBeenCalledWith({ client: mockHttpClient })

      expectCalledWithClient(adminApi)
      expectCalledWithClient(coreApi)
      expectCalledWithClient(nodeApi)
      expectCalledWithClient(userApi)
      expectCalledWithClient(systemApi)
      expectCalledWithClient(subscriptionApi)
      expectCalledWithClient(userTemplateApi)
    })

    it('exposes api instances on the public sdk properties', () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)

      expect(sdk.admin).toBeDefined()
      expect(sdk.core).toBeDefined()
      expect(sdk.node).toBeDefined()
      expect(sdk.user).toBeDefined()
      expect(sdk.system).toBeDefined()
      expect(sdk.subscription).toBeDefined()
      expect(sdk.userTemplate).toBeDefined()
    })
  })

  describe('constructor – LogsStream', () => {
    it('creates LogsStream with baseUrl, authService, and logger', () => {
      new MarzbanSDK(BASE_CONFIG)

      expect(mockLogsStreamCtor).toHaveBeenCalledWith(
        BASE_CONFIG.baseUrl,
        expect.any(MockAuthManager),
        expect.any(Object),
        undefined // config.retries is filled by validateConfig in production
      )
    })

    it('exposes the LogsStream instance as sdk.logs', () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)
      expect(sdk.logs).toBe(mockLogsStreamInstance)
    })
  })

  describe('constructor – WebhookManager', () => {
    it('passes merged webhook config and logger to WebhookManager', () => {
      const webhookConfig = { port: 9000, secret: 'abc' }
      new MarzbanSDK({ ...BASE_CONFIG, webhook: webhookConfig })

      expect(mockWebhookManagerCtor).toHaveBeenCalledWith(
        expect.objectContaining({ port: 9000, secret: 'abc', logger: expect.any(Object) })
      )
    })

    it('works without a webhook config (no crash, logger still forwarded)', () => {
      new MarzbanSDK(BASE_CONFIG)

      expect(mockWebhookManagerCtor).toHaveBeenCalledWith(expect.objectContaining({ logger: expect.any(Object) }))
    })

    it('exposes the WebhookManager instance as sdk.webhook', () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)
      expect(sdk.webhook).toBe(mockWebhookInstance)
    })
  })

  // ── getAuthToken ────────────────────────────────────────────────────────────

  describe('getAuthToken', () => {
    it('waits for the current auth flow before returning', async () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)

      await sdk.getAuthToken()

      expect(mockAuthInstance.waitForCurrentAuth).toHaveBeenCalledOnce()
    })

    it('returns the access token from the auth service', async () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)
      mockAuthInstance.accessToken = 'fresh-token'

      await expect(sdk.getAuthToken()).resolves.toBe('fresh-token')
    })

    it('propagates rejections from waitForCurrentAuth', async () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)
      mockAuthInstance.waitForCurrentAuth.mockRejectedValueOnce(new Error('auth timed out'))

      await expect(sdk.getAuthToken()).rejects.toThrow('auth timed out')
    })
  })

  // ── authorize ───────────────────────────────────────────────────────────────

  describe('authorize', () => {
    it('delegates to authenticate with the configured credentials', async () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)

      await sdk.authorize()

      expect(mockAuthInstance.authenticate).toHaveBeenCalledWith('admin', 's3cr3t')
    })

    it('returns the promise produced by authenticate (dedup is AuthManager’s responsibility)', () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)
      const ongoingPromise = Promise.resolve()
      mockAuthInstance.authenticate.mockReturnValueOnce(ongoingPromise)

      // authorize delegates straight to authenticate; concurrent-call
      // de-duplication is covered by AuthManager's own unit tests.
      expect(sdk.authorize()).toBe(ongoingPromise)
      expect(mockAuthInstance.authenticate).toHaveBeenCalledWith('admin', 's3cr3t')
    })
  })

  // ── destroy ─────────────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('closes all log stream connections', async () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)

      await sdk.destroy()

      expect(mockLogsStreamInstance.closeAllConnections).toHaveBeenCalledOnce()
    })

    it('resolves successfully even when closeAllConnections throws', async () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)
      mockLogsStreamInstance.closeAllConnections.mockImplementation(() => {
        throw new Error('stream already closed')
      })

      await expect(sdk.destroy()).resolves.toBeUndefined()
    })

    it('logs the error code when closeAllConnections throws an SdkError', async () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)
      const err = new HttpError('boom') // HttpError extends SdkError
      mockLogsStreamInstance.closeAllConnections.mockImplementation(() => {
        throw err
      })

      await expect(sdk.destroy()).resolves.toBeUndefined()
      expect(mockLogger.error).toHaveBeenCalledWith(err.message, err.stack, err.code)
    })

    it('logs a generic message when closeAllConnections throws a non-Error', async () => {
      const sdk = new MarzbanSDK(BASE_CONFIG)
      mockLogsStreamInstance.closeAllConnections.mockImplementation(() => {
        throw 'string failure'
      })

      await expect(sdk.destroy()).resolves.toBeUndefined()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to close connections during destroy',
        'string failure',
        'MarzbanSDK'
      )
    })
  })
})

// ─── createMarzbanSDK factory ─────────────────────────────────────────────────

describe('createMarzbanSDK', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockValidateConfig.mockImplementation((c: AnyType) => c)
    mockCreateLogger.mockReturnValue(mockLogger)
    mockConfigureHttpClient.mockReturnValue({ client: mockHttpClient, publicClient: mockPublicClient })
  })

  it('returns an MarzbanSDK instance', async () => {
    const sdk = await createMarzbanSDK(BASE_CONFIG)
    expect(sdk).toBeInstanceOf(MarzbanSDK)
  })

  it('authenticates with the provided credentials when authenticateOnInit is true', async () => {
    await createMarzbanSDK({ ...BASE_CONFIG, authenticateOnInit: true })
    expect(mockAuthInstance.authenticate).toHaveBeenCalledWith('admin', 's3cr3t')
  })

  it('skips authentication when authenticateOnInit is false', async () => {
    await createMarzbanSDK({ ...BASE_CONFIG, authenticateOnInit: false })
    expect(mockAuthInstance.authenticate).not.toHaveBeenCalled()
  })

  it('authenticates when authenticateOnInit is not provided (defaults to true)', async () => {
    await createMarzbanSDK({ ...BASE_CONFIG, authenticateOnInit: true })
    expect(mockAuthInstance.authenticate).toHaveBeenCalledWith('admin', 's3cr3t')
  })

  it('creates a single logger (in the constructor only)', async () => {
    await createMarzbanSDK({ ...BASE_CONFIG, authenticateOnInit: true })
    // The factory no longer builds its own logger from unvalidated config.
    expect(mockCreateLogger).toHaveBeenCalledTimes(1)
  })
})
