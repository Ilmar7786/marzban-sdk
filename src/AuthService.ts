import { AdminApi, Configuration } from './generated-sources'
import { Logger } from './logger'

/**
 * Error message constants
 */
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials provided',
  MISSING_CREDENTIALS: 'Missing credentials',
  AUTHENTICATION_FAILED: 'Authentication failed',
  TOKEN_RETRIEVAL_FAILED: 'Failed to retrieve access token',
  INVALID_TOKEN: 'Invalid access token',
} as const

/**
 * Interface for authentication credentials
 */
export interface Credentials {
  username: string
  password: string
}

/**
 * Interface for authentication service
 */
export interface IAuthService {
  authenticate(credentials: Credentials): Promise<void>
  waitForAuth(): Promise<void>
  retryAuth(): Promise<void>
  getAccessToken(): string
  setAccessToken(token: string): void
  isAuthenticated(): boolean
  clearAuth(): void
}

/**
 * Custom authentication error
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'AuthenticationError'

    // Support for V8 stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError)
    }
  }
}

/**
 * Authentication service for Marzban API
 *
 * @example
 * ```typescript
 * const authService = new AuthService(configuration, logger)
 * await authService.authenticate({ username: 'admin', password: 'password' })
 * ```
 */
export class AuthService implements IAuthService {
  private readonly configuration: Configuration
  private readonly logger: Logger
  private authPromise: Promise<void> | null = null
  private isAuthenticating = false
  private readonly adminApi: AdminApi

  constructor(configuration: Configuration, logger: Logger) {
    this.configuration = configuration
    this.logger = logger
    this.adminApi = new AdminApi(configuration)
  }

  /**
   * Authenticates user with provided credentials
   *
   * @param credentials - Object containing username and password
   * @throws {AuthenticationError} When authentication fails
   */
  async authenticate(credentials: Credentials): Promise<void> {
    this.logger.debug('Starting authentication process', 'AuthService')
    this.validateCredentials(credentials)

    // If authentication is already in progress, return existing Promise
    if (this.authPromise) {
      this.logger.info('Authentication already in progress, returning existing promise', 'AuthService')
      return this.authPromise
    }

    this.isAuthenticating = true
    this.authPromise = this.performAuthentication(credentials)

    return this.authPromise
  }

  /**
   * Waits for current authentication to complete
   */
  async waitForAuth(): Promise<void> {
    this.logger.debug('Waiting for authentication to complete', 'AuthService')
    return this.authPromise ?? Promise.resolve()
  }

  /**
   * Retries authentication with stored credentials
   *
   * @throws {AuthenticationError} When credentials are not configured
   */
  async retryAuth(): Promise<void> {
    this.logger.info('Retrying authentication with stored credentials', 'AuthService')
    const credentials = this.getStoredCredentials()
    if (!credentials) {
      this.logger.error(ERROR_MESSAGES.MISSING_CREDENTIALS, undefined, 'AuthService')
      throw new AuthenticationError(ERROR_MESSAGES.MISSING_CREDENTIALS, undefined, 'MISSING_CREDENTIALS')
    }

    return this.authenticate(credentials)
  }

  /**
   * Returns current access token
   */
  getAccessToken(): string {
    return this.configuration.accessToken?.toString() || ''
  }

  /**
   * Sets access token
   *
   * @param token - Access token
   */
  setAccessToken(token: string): void {
    if (!token || typeof token !== 'string') {
      this.logger.error(ERROR_MESSAGES.INVALID_TOKEN, undefined, 'AuthService')
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_TOKEN, undefined, 'INVALID_TOKEN')
    }
    this.logger.debug('Access token set successfully', 'AuthService')
    this.configuration.accessToken = token
  }

  /**
   * Checks if user is authenticated
   */
  isAuthenticated(): boolean {
    return Boolean(this.configuration.accessToken)
  }

  /**
   * Clears authentication data
   */
  clearAuth(): void {
    this.logger.warn('Clearing authentication data', 'AuthService')
    this.configuration.accessToken = undefined
    this.authPromise = null
    this.isAuthenticating = false
  }

  /**
   * Getter for checking authentication state
   */
  get isAuthInProgress(): boolean {
    return this.isAuthenticating
  }

  /**
   * Validates provided credentials
   *
   * @param credentials - Object containing credentials
   * @throws {AuthenticationError} When credentials are invalid
   */
  private validateCredentials(credentials: Credentials): void {
    this.logger.debug('Validating credentials', 'AuthService')

    if (!credentials) {
      this.logger.error(ERROR_MESSAGES.MISSING_CREDENTIALS, undefined, 'AuthService')
      throw new AuthenticationError(ERROR_MESSAGES.MISSING_CREDENTIALS, undefined, 'MISSING_CREDENTIALS')
    }

    if (!credentials.username || typeof credentials.username !== 'string') {
      this.logger.error(ERROR_MESSAGES.INVALID_CREDENTIALS, undefined, 'AuthService')
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS, undefined, 'INVALID_USERNAME')
    }

    if (!credentials.password || typeof credentials.password !== 'string') {
      this.logger.error(ERROR_MESSAGES.INVALID_CREDENTIALS, undefined, 'AuthService')
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS, undefined, 'INVALID_PASSWORD')
    }
  }

  /**
   * Performs authentication process
   *
   * @param credentials - Object containing credentials
   */
  private async performAuthentication(credentials: Credentials): Promise<void> {
    this.logger.debug('Performing authentication request', 'AuthService')
    try {
      const tokenData = await this.adminApi.adminToken(credentials.username, credentials.password)

      if (!tokenData?.access_token) {
        this.logger.error(ERROR_MESSAGES.TOKEN_RETRIEVAL_FAILED, undefined, 'AuthService')
        throw new AuthenticationError(ERROR_MESSAGES.TOKEN_RETRIEVAL_FAILED, undefined, 'TOKEN_RETRIEVAL_FAILED')
      }

      this.configuration.accessToken = tokenData.access_token
      this.logger.info('Authentication successful', 'AuthService')
    } catch (error) {
      const authError = this.handleAuthenticationError(error)
      this.clearAuth()
      throw authError
    } finally {
      this.authPromise = null
      this.isAuthenticating = false
    }
  }

  /**
   * Handles authentication errors
   *
   * @param error - Original error
   */
  private handleAuthenticationError(error: unknown): AuthenticationError {
    if (error instanceof AuthenticationError) {
      return error
    }

    this.logger.error(ERROR_MESSAGES.AUTHENTICATION_FAILED, error, 'AuthService')
    return new AuthenticationError(
      ERROR_MESSAGES.AUTHENTICATION_FAILED,
      error instanceof Error ? error : undefined,
      'AUTHENTICATION_FAILED'
    )
  }

  /**
   * Retrieves stored credentials from configuration
   */
  private getStoredCredentials(): Credentials | null {
    if (!this.configuration.username || !this.configuration.password) {
      return null
    }

    return {
      username: this.configuration.username,
      password: this.configuration.password,
    }
  }
}
