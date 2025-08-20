import { adminApi } from '../../gen/api'
import { AuthenticationError } from '../errors'
import { getPublicInstance } from '../http'
import { Configuration } from './auth.types'

export class AuthManager {
  private configuration: Configuration
  public authPromise: Promise<void> | null = null
  public isAuthenticating = false

  constructor(configuration: Configuration) {
    this.configuration = configuration
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
            this.configuration.accessToken = data.access_token
            resolve()
          } else {
            this.configuration.accessToken = undefined
            reject(new AuthenticationError('Failed to retrieve access token'))
          }
        } catch (error) {
          console.error('Authentication failed', error)
          this.configuration.accessToken = undefined
          reject(new AuthenticationError('Authentication failed'))
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
    return this.authenticate(this.configuration.username!, this.configuration.password!)
  }

  get accessToken() {
    return this.configuration.accessToken?.toString() || ''
  }

  set accessToken(token: string) {
    this.configuration.accessToken = token
  }
}
