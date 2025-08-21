import { adminApi } from '../../gen/api'
import { AuthError, AuthTokenError } from '../errors'
import { getPublicInstance } from '../http'
import { Storage } from './auth.types'

export class AuthManager {
  private readonly storage: Storage
  public authPromise: Promise<void> | null = null
  public isAuthenticating = false

  constructor(storage: Storage) {
    this.storage = storage
  }

  async authenticate(username: string, password: string): Promise<void> {
    if (this.authPromise) return this.authPromise

    this.isAuthenticating = true
    this.authPromise = new Promise((resolve, reject) => {
      const authenticateAsync = async () => {
        try {
          const admin = adminApi()
          const data = await admin.adminToken({ username, password }, { client: getPublicInstance() })
          if (data?.access_token) {
            this.storage.accessToken = data.access_token
            resolve()
          } else {
            this.storage.accessToken = undefined
            reject(new AuthTokenError())
          }
        } catch (error) {
          console.error('Authentication failed', error)
          this.storage.accessToken = undefined
          reject(new AuthError(error))
        } finally {
          this.authPromise = null
          this.isAuthenticating = false
        }
      }
      authenticateAsync()
    })

    return this.authPromise
  }

  async waitForAuth(): Promise<void> {
    return this.authPromise ?? Promise.resolve()
  }

  retryAuth() {
    return this.authenticate(this.storage.username, this.storage.password)
  }

  get accessToken() {
    return this.storage.accessToken?.toString() || ''
  }

  set accessToken(token: string) {
    this.storage.accessToken = token
  }
}
