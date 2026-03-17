import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnyType } from '@/common'

const mockValidateConfig = vi.fn((c: AnyType) => c)
const mockCreateLogger = vi.fn(() => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }))
const mockAuthManager = vi.fn()
class MockAuthManager {
  public isAuthenticating = false
  public authPromise: Promise<void> | null = null
  public accessToken = 'token'

  authenticate = vi.fn().mockResolvedValue(undefined)
  waitForCurrentAuth = vi.fn().mockResolvedValue(undefined)
  setPublicClient = vi.fn()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_config: AnyType, _logger: AnyType) {
    mockAuthManager()
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockAuthInstance = this
  }
}

let mockAuthInstance: MockAuthManager
const mockConfigureHttpClient = vi.fn(() => ({ client: { request: vi.fn() }, publicClient: { request: vi.fn() } }))
const mockBindClientToApi = vi.fn((api: AnyType, client: AnyType) => ({ api, client }))
const mockLogsStream = vi.fn()
class MockLogsStream {
  public closeAllConnections = vi.fn()

  constructor(_baseUrl: string, _auth: AnyType, _logger: AnyType) {
    mockLogsStream(_baseUrl, _auth, _logger)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockLogsStreamInstance = this
  }
}

let mockLogsStreamInstance: MockLogsStream

const mockWebhookManagerCtor = vi.fn()
class MockWebhookManager {
  public close = vi.fn()
  constructor(_opts: AnyType) {
    mockWebhookManagerCtor(_opts)
  }
}

// Mock auto-generated API factories so MarzbanSDK can instantiate them without hitting the network.
const mockBase = vi.fn(() => ({ base: true }))
vi.mock('@/gen/api', () => ({
  adminApi: vi.fn(() => ({ admin: true })),
  coreApi: vi.fn(() => ({ core: true })),
  nodeApi: vi.fn(() => ({ node: true })),
  userApi: vi.fn(() => ({ user: true })),
  systemApi: vi.fn(() => ({ system: true })),
  subscriptionApi: vi.fn(() => ({ subscription: true })),
  userTemplateApi: vi.fn(() => ({ userTemplate: true })),
  base: mockBase,
}))

vi.mock('@/config', () => ({
  validateConfig: mockValidateConfig,
}))

vi.mock('./logger', () => ({
  createLogger: mockCreateLogger,
}))

vi.mock('./auth', () => ({
  AuthManager: MockAuthManager,
}))

vi.mock('./http', () => ({
  configureHttpClient: mockConfigureHttpClient,
  bindClientToApi: mockBindClientToApi,
}))

vi.mock('./ws', () => ({
  LogsStream: MockLogsStream,
}))

vi.mock('./webhook', () => ({
  WebhookManager: MockWebhookManager,
}))

const { MarzbanSDK, createMarzbanSDK } = await import('./MarzbanSDK')

describe('MarzbanSDK entrypoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds api modules and exposes them on the SDK instance', () => {
    const sdk = new MarzbanSDK({ baseUrl: 'https://api', username: 'u', password: 'p' })

    expect(mockValidateConfig).toHaveBeenCalled()
    expect(mockCreateLogger).toHaveBeenCalled()
    expect(mockAuthManager).toHaveBeenCalled()

    expect(sdk.admin).toEqual({ api: { admin: true }, client: expect.anything() })
    expect(sdk.core).toEqual({ api: { core: true }, client: expect.anything() })
    expect(sdk.node).toEqual({ api: { node: true }, client: expect.anything() })
    expect(sdk.user).toEqual({ api: { user: true }, client: expect.anything() })
    expect(sdk.system).toEqual({ api: { system: true }, client: expect.anything() })
    expect(sdk.subscription).toEqual({ api: { subscription: true }, client: expect.anything() })
    expect(sdk.userTemplate).toEqual({ api: { userTemplate: true }, client: expect.anything() })
    expect(sdk.default).toEqual({ base: expect.any(Function) })

    expect(mockLogsStream).toHaveBeenCalledWith('https://api', expect.any(MockAuthManager), expect.any(Object))
    expect(sdk.logs).toBe(mockLogsStreamInstance)

    expect(mockWebhookManagerCtor).toHaveBeenCalledWith({ logger: expect.any(Object) })
    expect(sdk.webhook).toEqual({ close: expect.any(Function) })

    // Ensure the default base client wrapper is callable and forwards config
    sdk.default.base({ foo: 'bar' } as AnyType)
    expect(mockBase).toHaveBeenCalledWith({ foo: 'bar', client: expect.any(Object) })
  })

  it('createMarzbanSDK performs authentication when authenticateOnInit is true', async () => {
    await createMarzbanSDK({ baseUrl: 'https://api', username: 'u', password: 'p', authenticateOnInit: true })
    expect(mockAuthInstance.authenticate).toHaveBeenCalledWith('u', 'p')
  })

  it('createMarzbanSDK skips authentication when authenticateOnInit is false', async () => {
    await createMarzbanSDK({ baseUrl: 'https://api', username: 'u', password: 'p', authenticateOnInit: false })
    expect(mockAuthInstance.authenticate).not.toHaveBeenCalled()
  })

  it('authorize triggers authenticate when not already authenticating', async () => {
    const sdk = new MarzbanSDK({ baseUrl: 'https://api', username: 'u', password: 'p' })

    await sdk.authorize()
    expect(mockAuthInstance.authenticate).toHaveBeenCalledWith('u', 'p')
  })

  it('getAuthToken waits for auth and returns the access token', async () => {
    const sdk = new MarzbanSDK({ baseUrl: 'https://api', username: 'u', password: 'p' })
    mockAuthInstance.waitForCurrentAuth.mockResolvedValueOnce(undefined)

    await expect(sdk.getAuthToken()).resolves.toEqual('token')
    expect(mockAuthInstance.waitForCurrentAuth).toHaveBeenCalled()
  })

  it('authorize returns existing auth promise when authentication in progress', async () => {
    const sdk = new MarzbanSDK({ baseUrl: 'https://api', username: 'u', password: 'p' })
    const promise = Promise.resolve()
    mockAuthInstance.isAuthenticating = true
    mockAuthInstance.authPromise = promise

    await expect(sdk.authorize()).resolves.toBeUndefined()
    expect(mockAuthInstance.authenticate).not.toHaveBeenCalled()
  })

  it('destroy calls logs stream closeAllConnections and swallows errors', async () => {
    const sdk = new MarzbanSDK({ baseUrl: 'https://api', username: 'u', password: 'p' })
    mockLogsStreamInstance.closeAllConnections.mockImplementation(() => {
      throw new Error('boom')
    })

    await expect(sdk.destroy()).resolves.toBeUndefined()
    expect(mockLogsStreamInstance.closeAllConnections).toHaveBeenCalled()
  })
})
