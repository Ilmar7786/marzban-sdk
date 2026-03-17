import { AuthError, AuthTokenError } from '@/core/errors'
import { getPublicClient } from '@/core/http'
import type { ClientFn } from '@/core/http/client'
import { Logger } from '@/core/logger'
import { adminApi } from '@/gen/api'

import { Storage } from './auth.types'

export class AuthManager {
  private readonly storage: Storage
  private readonly logger: Logger
  /** When set, used for login (adminToken) instead of global client. */
  private publicClientFn: ClientFn | null = null

  public authPromise: Promise<void> | null = null

  constructor(storage: Storage, logger: Logger) {
    this.storage = storage
    this.logger = logger
    this.logger.debug('AuthManager initialized', 'AuthManager')
  }

  /** Set instance-bound public HTTP client for authentication (used when multiple SDK instances exist). */
  setPublicClient(client: ClientFn): this {
    this.publicClientFn = client
    return this
  }

  authenticate(username: string, password: string): Promise<void> {
    if (this.authPromise) {
      this.logger.debug('Authentication already in progress, returning existing promise', 'AuthManager')
      return this.authPromise
    }

    this.logger.info(`Starting authentication for user: ${username}`, 'AuthManager')

    this.authPromise = this.authenticateInternal(username, password)
    return this.authPromise
  }

  async waitForCurrentAuth(): Promise<void> {
    if (this.authPromise) {
      this.logger.debug('Waiting for existing authentication to complete', 'AuthManager')
    }
    return this.authPromise ?? Promise.resolve()
  }

  retryAuth() {
    const { username, password } = this.storage

    if (!username || !password) {
      const err = new AuthError('No stored credentials')
      this.logger.error('Retry auth failed: no credentials', err, 'AuthManager')
      throw err
    }

    return this.authenticate(username, password)
  }

  get isAuthenticating() {
    return this.authPromise !== null
  }

  get accessToken() {
    return this.storage.accessToken?.toString() || ''
  }

  set accessToken(token: string) {
    this.storage.accessToken = token
    this.logger.debug('Access token updated', 'AuthManager')
  }

  private async authenticateInternal(username: string, password: string): Promise<void> {
    try {
      this.logger.debug('Making authentication request to admin API', 'AuthManager')
      const requestClient = this.publicClientFn ?? getPublicClient()
      const admin = adminApi()
      const data = await admin.adminToken({ username, password }, { client: requestClient })

      if (data?.access_token) {
        this.storage.accessToken = data.access_token
        this.logger.info('Authentication successful, token stored', 'AuthManager')
      } else {
        this.storage.accessToken = undefined
        this.logger.error('Authentication failed: No access token received', null, 'AuthManager')
        throw new AuthTokenError()
      }
    } catch (error) {
      this.storage.accessToken = undefined

      // Re-throw AuthError subclasses (including AuthTokenError) as-is.
      // Only wrap truly unknown errors in AuthError.
      // Re-throw known auth errors as-is, only wrap unknown errors.
      // We check .name instead of instanceof to avoid issues with multiple
      // module instances in test environments.
      const isKnownAuthError = error instanceof Error && (error.name === 'AuthError' || error.name === 'AuthTokenError')

      if (isKnownAuthError) {
        throw error
      }

      const err = new AuthError(error)
      this.logger.error('Authentication request failed', err, 'AuthManager')
      throw err
    } finally {
      this.authPromise = null
      this.logger.debug('Authentication process completed', 'AuthManager')
    }
  }
}
