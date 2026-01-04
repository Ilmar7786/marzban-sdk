import { SafeEventEmitter } from '@/common'
import { AuthError, AuthTokenError } from '@/core/errors'
import { getPublicInstance } from '@/core/http'
import { Logger } from '@/core/logger'
import { adminApi } from '@/gen/api'

import { Storage } from './auth.types'

export type AuthEvents = {
  start: void
  success: string
  failure: AuthError | AuthTokenError
}

export class AuthManager {
  private readonly storage: Storage
  private readonly logger: Logger
  private readonly emitter = new SafeEventEmitter<AuthEvents>()

  public authPromise: Promise<void> | null = null

  constructor(storage: Storage, logger: Logger) {
    this.storage = storage
    this.logger = logger
    this.logger.debug('AuthManager initialized', 'AuthManager')
  }

  async authenticate(username: string, password: string): Promise<void> {
    if (this.authPromise) {
      this.logger.debug('Authentication already in progress, returning existing promise', 'AuthManager')
      return this.authPromise
    }

    this.logger.info(`Starting authentication for user: ${username}`, 'AuthManager')
    this.emitter.emit('start', undefined)

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

  on<TEvent extends keyof AuthEvents>(
    event: TEvent,
    listener: (payload: AuthEvents[TEvent]) => void | Promise<void>
  ): this {
    this.emitter.on(event, listener)
    return this
  }

  once<TEvent extends keyof AuthEvents>(
    event: TEvent,
    listener: (payload: AuthEvents[TEvent]) => void | Promise<void>
  ): this {
    this.emitter.once(event, listener)
    return this
  }

  off<TEvent extends keyof AuthEvents>(
    event: TEvent,
    listener: (payload: AuthEvents[TEvent]) => void | Promise<void>
  ): this {
    this.emitter.off(event, listener)
    return this
  }

  private async authenticateInternal(username: string, password: string): Promise<void> {
    try {
      this.logger.debug('Making authentication request to admin API', 'AuthManager')
      const admin = adminApi()
      const data = await admin.adminToken({ username, password }, { client: getPublicInstance() })

      if (data?.access_token) {
        this.storage.accessToken = data.access_token
        this.logger.info('Authentication successful, token stored', 'AuthManager')
        this.emitter.emit('success', data.access_token)
      } else {
        this.storage.accessToken = undefined
        this.logger.error('Authentication failed: No access token received', null, 'AuthManager')
        const err = new AuthTokenError()
        this.emitter.emit('failure', err)
        throw err
      }
    } catch (error) {
      this.storage.accessToken = undefined
      const err = error instanceof AuthError ? error : new AuthError(error)
      this.logger.error('Authentication request failed', err, 'AuthManager')
      this.emitter.emit('failure', err)
      throw err
    } finally {
      this.authPromise = null
      this.logger.debug('Authentication process completed', 'AuthManager')
    }
  }
}
