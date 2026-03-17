/* eslint-disable no-empty */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthError, AuthTokenError } from '@/core/errors'
import { Logger } from '@/core/logger'

import { AuthManager } from './auth.manager'
import { Storage } from './auth.types'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/core/http', () => ({
  getPublicClient: vi.fn(() => 'public-client'),
}))

vi.mock('@/gen/api', () => ({
  adminApi: vi.fn(() => ({
    // Default to unresolved promise — each test overrides via makeAdminToken()
    adminToken: vi.fn().mockResolvedValue(null),
  })),
}))

import { getPublicClient } from '@/core/http'
import { adminApi } from '@/gen/api'

const mockGetPublicClient = vi.mocked(getPublicClient)
const mockAdminApi = vi.mocked(adminApi)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})

const makeStorage = (overrides?: Partial<Storage>): Storage => ({
  accessToken: undefined,
  username: 'admin',
  password: 'secret',
  ...overrides,
})

const makeAdminToken = (result: { access_token?: string } | null) => {
  const adminTokenFn = vi.fn().mockResolvedValue(result)
  mockAdminApi.mockReturnValue({ adminToken: adminTokenFn } as never)
  return adminTokenFn
}

// ─── AuthManager ─────────────────────────────────────────────────────────────

describe('AuthManager', () => {
  let logger: Logger
  let storage: Storage
  let manager: AuthManager

  beforeEach(() => {
    vi.clearAllMocks()
    logger = makeLogger()
    storage = makeStorage()
    manager = new AuthManager(storage, logger)
  })

  // ─── constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('logs initialization', () => {
      expect(logger.debug).toHaveBeenCalledWith('AuthManager initialized', 'AuthManager')
    })

    it('authPromise is null initially', () => {
      expect(manager.authPromise).toBeNull()
    })

    it('isAuthenticating is false initially', () => {
      expect(manager.isAuthenticating).toBe(false)
    })
  })

  // ─── setPublicClient ───────────────────────────────────────────────────────

  describe('setPublicClient', () => {
    it('returns this for chaining', () => {
      const client = vi.fn() as never
      expect(manager.setPublicClient(client)).toBe(manager)
    })

    it('uses the provided client instead of getPublicClient()', async () => {
      const customClient = vi.fn() as never
      const adminTokenFn = makeAdminToken({ access_token: 'tok' })
      manager.setPublicClient(customClient)
      await manager.authenticate('admin', 'secret')
      expect(adminTokenFn).toHaveBeenCalledWith({ username: 'admin', password: 'secret' }, { client: customClient })
      expect(mockGetPublicClient).not.toHaveBeenCalled()
    })
  })

  // ─── accessToken getter / setter ──────────────────────────────────────────

  describe('accessToken', () => {
    it('returns empty string when storage has no token', () => {
      expect(manager.accessToken).toBe('')
    })

    it('returns the stored token', () => {
      storage.accessToken = 'mytoken'
      expect(manager.accessToken).toBe('mytoken')
    })

    it('setter stores the token and logs debug', () => {
      manager.accessToken = 'newtoken'
      expect(storage.accessToken).toBe('newtoken')
      expect(logger.debug).toHaveBeenCalledWith('Access token updated', 'AuthManager')
    })
  })

  // ─── isAuthenticating ─────────────────────────────────────────────────────

  describe('isAuthenticating', () => {
    it('returns true while authentication is in progress', () => {
      makeAdminToken({ access_token: 'tok' })
      manager.authenticate('admin', 'secret')
      expect(manager.isAuthenticating).toBe(true)
    })

    it('returns false after authentication completes', async () => {
      makeAdminToken({ access_token: 'tok' })
      await manager.authenticate('admin', 'secret')
      expect(manager.isAuthenticating).toBe(false)
    })
  })

  // ─── authenticate ─────────────────────────────────────────────────────────

  describe('authenticate', () => {
    it('stores the access token on success', async () => {
      makeAdminToken({ access_token: 'tok123' })
      await manager.authenticate('admin', 'secret')
      expect(storage.accessToken).toBe('tok123')
    })

    it('uses getPublicClient() when no custom client is set', async () => {
      const adminTokenFn = makeAdminToken({ access_token: 'tok' })
      await manager.authenticate('admin', 'secret')
      expect(mockGetPublicClient).toHaveBeenCalled()
      expect(adminTokenFn).toHaveBeenCalledWith({ username: 'admin', password: 'secret' }, { client: 'public-client' })
    })

    it('logs info when authentication starts', async () => {
      makeAdminToken({ access_token: 'tok' })
      await manager.authenticate('admin', 'secret')
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('admin'), 'AuthManager')
    })

    it('logs info when authentication succeeds', async () => {
      makeAdminToken({ access_token: 'tok' })
      await manager.authenticate('admin', 'secret')
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('successful'), 'AuthManager')
    })

    it('returns the existing promise when called while auth is in progress', async () => {
      makeAdminToken({ access_token: 'tok' })
      const p1 = manager.authenticate('admin', 'secret')
      const p2 = manager.authenticate('admin', 'secret')
      expect(p1).toBe(p2)
      await p1
    })

    it('logs debug when auth is already in progress', async () => {
      makeAdminToken({ access_token: 'tok' })
      manager.authenticate('admin', 'secret')
      vi.clearAllMocks()
      manager.authenticate('admin', 'secret')
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('already in progress'), 'AuthManager')
    })

    it('resets authPromise to null after success', async () => {
      makeAdminToken({ access_token: 'tok' })
      await manager.authenticate('admin', 'secret')
      expect(manager.authPromise).toBeNull()
    })

    it('resets authPromise to null after failure', async () => {
      makeAdminToken(null)
      await expect(manager.authenticate('admin', 'secret')).rejects.toThrow()
      expect(manager.authPromise).toBeNull()
    })
  })

  // ─── authenticateInternal — failure branches ──────────────────────────────

  describe('authenticate — failure branches', () => {
    it('throws AuthTokenError when response has no access_token', async () => {
      makeAdminToken({})
      await expect(manager.authenticate('admin', 'secret')).rejects.toBeInstanceOf(AuthTokenError)
    })

    it('clears storage token when response has no access_token', async () => {
      storage.accessToken = 'old'
      makeAdminToken({})
      await expect(manager.authenticate('admin', 'secret')).rejects.toThrow()
      expect(storage.accessToken).toBeUndefined()
    })

    it('logs error when response has no access_token', async () => {
      makeAdminToken({})
      await expect(manager.authenticate('admin', 'secret')).rejects.toThrow()
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('No access token'), null, 'AuthManager')
    })

    it('wraps non-AuthError exceptions in AuthError and rethrows', async () => {
      mockAdminApi.mockReturnValue({
        adminToken: vi.fn().mockRejectedValue(new Error('network error')),
      } as never)
      await expect(manager.authenticate('admin', 'secret')).rejects.toBeInstanceOf(AuthError)
    })

    it('rethrows AuthError as-is without double wrapping', async () => {
      const original = new AuthError('original')
      mockAdminApi.mockReturnValue({
        adminToken: vi.fn().mockRejectedValue(original),
      } as never)
      const err = await manager.authenticate('admin', 'secret').catch(e => e)
      expect(err).toBe(original)
    })

    it('clears storage token when the request throws', async () => {
      storage.accessToken = 'old'
      mockAdminApi.mockReturnValue({
        adminToken: vi.fn().mockRejectedValue(new Error('boom')),
      } as never)
      await expect(manager.authenticate('admin', 'secret')).rejects.toThrow()
      expect(storage.accessToken).toBeUndefined()
    })
  })

  // ─── waitForCurrentAuth ───────────────────────────────────────────────────

  describe('waitForCurrentAuth', () => {
    it('resolves immediately when no auth is in progress', async () => {
      await expect(manager.waitForCurrentAuth()).resolves.toBeUndefined()
    })

    it('waits for the current auth promise to settle', async () => {
      makeAdminToken({ access_token: 'tok' })
      manager.authenticate('admin', 'secret')
      await manager.waitForCurrentAuth()
      expect(storage.accessToken).toBe('tok')
    })

    it('logs debug when waiting for existing auth', async () => {
      makeAdminToken({ access_token: 'tok' })
      manager.authenticate('admin', 'secret')
      vi.clearAllMocks()
      await manager.waitForCurrentAuth()
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Waiting'), 'AuthManager')
    })
  })

  // ─── retryAuth ────────────────────────────────────────────────────────────

  describe('retryAuth', () => {
    it('throws AuthError when no credentials are stored', () => {
      const manager = new AuthManager(makeStorage({ username: undefined, password: undefined }), logger)
      expect(() => manager.retryAuth()).toThrow(AuthError)
    })

    it('throws AuthError when only username is missing', () => {
      const manager = new AuthManager(makeStorage({ username: undefined }), logger)
      expect(() => manager.retryAuth()).toThrow(AuthError)
    })

    it('throws AuthError when only password is missing', () => {
      const manager = new AuthManager(makeStorage({ password: undefined }), logger)
      expect(() => manager.retryAuth()).toThrow(AuthError)
    })

    it('logs error when credentials are missing', () => {
      const manager = new AuthManager(makeStorage({ username: undefined }), logger)
      try {
        manager.retryAuth()
      } catch {}
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('no credentials'),
        expect.any(AuthError),
        'AuthManager'
      )
    })

    it('calls authenticate with stored credentials', async () => {
      makeAdminToken({ access_token: 'tok' })
      await manager.retryAuth()
      expect(storage.accessToken).toBe('tok')
    })
  })
})
