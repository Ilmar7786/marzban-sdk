import { adminApi } from '../../gen/api'
import { AuthError, AuthTokenError } from '../errors'
import { getPublicInstance } from '../http'
import { Logger } from '../logger'
import { Storage } from './auth.types'

export class AuthManager {
  private readonly storage: Storage
  private readonly logger: Logger
  public authPromise: Promise<void> | null = null
  public isAuthenticating = false
  private listeners = {
    start: new Set<() => void>(),
    success: new Set<(token: string) => void>(),
    failure: new Set<(error: unknown) => void>(),
  }

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
    this.isAuthenticating = true
    this.emit('start')
    this.authPromise = new Promise((resolve, reject) => {
      const authenticateAsync = async () => {
        try {
          this.logger.debug('Making authentication request to admin API', 'AuthManager')
          const admin = adminApi()
          const data = await admin.adminToken({ username, password }, { client: getPublicInstance() })

          if (data?.access_token) {
            this.storage.accessToken = data.access_token
            this.logger.info('Authentication successful, token stored', 'AuthManager')
            this.emit('success', data.access_token)
            resolve()
          } else {
            this.storage.accessToken = undefined
            this.logger.error('Authentication failed: No access token received', null, 'AuthManager')
            const err = new AuthTokenError()
            this.emit('failure', err)
            reject(err)
          }
        } catch (error) {
          this.logger.error('Authentication request failed', error, 'AuthManager')
          this.storage.accessToken = undefined
          const err = new AuthError(error)
          this.emit('failure', err)
          reject(err)
        } finally {
          this.authPromise = null
          this.isAuthenticating = false
          this.logger.debug('Authentication process completed', 'AuthManager')
        }
      }
      authenticateAsync()
    })

    return this.authPromise
  }

  async waitForAuth(): Promise<void> {
    if (this.authPromise) {
      this.logger.debug('Waiting for existing authentication to complete', 'AuthManager')
    }
    return this.authPromise ?? Promise.resolve()
  }

  retryAuth() {
    this.logger.warn('Retrying authentication with stored credentials', 'AuthManager')
    return this.authenticate(this.storage.username, this.storage.password)
  }

  get accessToken() {
    const token = this.storage.accessToken?.toString() || ''
    if (token) {
      this.logger.debug('Access token retrieved', 'AuthManager')
    } else {
      this.logger.debug('No access token available', 'AuthManager')
    }
    return token
  }

  set accessToken(token: string) {
    this.storage.accessToken = token
    this.logger.debug('Access token updated', 'AuthManager')
  }

  on(event: 'start', cb: () => void): () => void
  on(event: 'success', cb: (token: string) => void): () => void
  on(event: 'failure', cb: (error: unknown) => void): () => void
  on(
    event: 'start' | 'success' | 'failure',
    cb: (() => void) | ((token: string) => void) | ((error: unknown) => void)
  ): () => void {
    switch (event) {
      case 'start':
        this.listeners.start.add(cb as () => void)
        return () => void this.listeners.start.delete(cb as () => void)
      case 'success':
        this.listeners.success.add(cb as (token: string) => void)
        return () => void this.listeners.success.delete(cb as (token: string) => void)
      case 'failure':
        this.listeners.failure.add(cb as (error: unknown) => void)
        return () => void this.listeners.failure.delete(cb as (error: unknown) => void)
    }
    return () => {}
  }

  private emit(event: 'start'): void
  private emit(event: 'success', token: string): void
  private emit(event: 'failure', error: unknown): void
  private emit(event: 'start' | 'success' | 'failure', payload?: unknown): void {
    try {
      if (event === 'start') {
        this.listeners.start.forEach(fn => fn())
      } else if (event === 'success') {
        this.listeners.success.forEach(fn => fn(payload as string))
      } else if (event === 'failure') {
        this.listeners.failure.forEach(fn => fn(payload))
      }
    } catch {
      // swallow listener errors
    }
  }
}
