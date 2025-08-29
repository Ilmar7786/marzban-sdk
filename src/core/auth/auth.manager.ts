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
    this.authPromise = new Promise((resolve, reject) => {
      const authenticateAsync = async () => {
        try {
          this.logger.debug('Making authentication request to admin API', 'AuthManager')
          const admin = adminApi()
          const data = await admin.adminToken({ username, password }, { client: getPublicInstance() })

          if (data?.access_token) {
            this.storage.accessToken = data.access_token
            this.logger.info('Authentication successful, token stored', 'AuthManager')
            resolve()
          } else {
            this.storage.accessToken = undefined
            this.logger.error('Authentication failed: No access token received', null, 'AuthManager')
            reject(new AuthTokenError())
          }
        } catch (error) {
          this.logger.error('Authentication request failed', error, 'AuthManager')
          this.storage.accessToken = undefined
          reject(new AuthError(error))
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
}
