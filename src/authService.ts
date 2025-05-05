import { Configuration, AdminApi } from './generated-sources'

export class AuthService {
  private configuration: Configuration
  private authPromise: Promise<void> | null = null

  constructor(configuration: Configuration) {
    this.configuration = configuration
  }

  async authenticate(username: string, password: string): Promise<void> {
    if (this.authPromise) return this.authPromise

    this.authPromise = new Promise(async (resolve, reject) => {
      try {
        const admin = new AdminApi(this.configuration)
        const data = await admin.adminToken(username, password)
        if (data?.access_token) {
          this.configuration.accessToken = data.access_token
          resolve()
        } else {
          this.configuration.accessToken = undefined
          reject(new Error('Failed to retrieve access token'))
        }
      } catch (error) {
        console.error('Authentication failed', error)
        this.configuration.accessToken = undefined
        reject(error)
      } finally {
        this.authPromise = null
      }
    })

    return this.authPromise
  }

  async waitForAuth(): Promise<void> {
    let promises = true

    while (promises)
      if (this.authPromise) {
        promises = true
        await this.authPromise
      } else {
        promises = false
      }
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
