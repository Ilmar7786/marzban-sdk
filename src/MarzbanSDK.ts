import { AxiosInstance } from 'axios'

import { AuthService } from './AuthService'
import { createAxiosClient } from './createAxiosClient'
import {
  AdminApi,
  Configuration,
  CoreApi,
  DefaultApi,
  NodeApi,
  SubscriptionApi,
  SystemApi,
  UserApi,
  UserTemplateApi,
} from './generated-sources'
import { setupInterceptors } from './interceptors'
import { LogsApi } from './LogsApi'

/**
 * Configuration options for initializing the MarzbanSDK client.
 *
 * @property {string} baseUrl - The base URL of the Marzban API instance. Example: 'https://api.example.com'.
 * @property {string} username - The username for authentication. Required for all authenticated operations.
 * @property {string} password - The password for authentication. Required for all authenticated operations.
 * @property {string} [token] - Optional JWT token for direct authorization. If provided, the SDK will use this token for requests instead of performing authentication.
 * @property {number} [retries] - Optional number of automatic retries for failed HTTP requests. Default is 3.
 * @property {boolean} [authenticateOnInit=true] - If true or omitted, the SDK will automatically perform authentication during initialization using the provided credentials. If set to false, authentication will not be performed automatically; you must call {@link MarzbanSDK.authorize} manually to obtain an access token.
 */
export interface Config {
  baseUrl: string
  username: string
  password: string
  token?: string
  retries?: number
  authenticateOnInit?: boolean
}

/**
 * The main SDK class for interacting with the Marzban API.
 *
 * This class provides access to various API modules (e.g., Admin, Core, Node, etc.)
 * and handles authentication, request retries, and interceptor setup.
 */
export class MarzbanSDK {
  private client: AxiosInstance
  private configuration: Configuration
  private authService: AuthService

  /**
   * API module for administrative operations.
   */
  admin: AdminApi

  /**
   * API module for core operations.
   */
  core: CoreApi

  /**
   * API module for node-related operations.
   */
  node: NodeApi

  /**
   * API module for user-related operations.
   */
  user: UserApi

  /**
   * API module for system-related operations.
   */
  system: SystemApi

  /**
   * API module for default operations.
   */
  default: DefaultApi

  /**
   * API module for subscription-related operations.
   */
  subscription: SubscriptionApi

  /**
   * API module for user template operations.
   */
  userTemplate: UserTemplateApi

  /**
   * API module for logs-related operations.
   */
  logs: LogsApi

  /**
   * Instantiates the MarzbanSDK client for interacting with the Marzban API.
   *
   * @param {Config} config - The configuration object for the SDK.
   * @param {string} config.baseUrl - The base URL of the Marzban API.
   * @param {string} config.username - The username for authentication.
   * @param {string} config.password - The password for authentication.
   * @param {string} [config.token] - Optional JWT token for direct authorization if already authenticated.
   * @param {number} [config.retries] - Optional number of automatic retries for failed HTTP requests.
   * @param {boolean} [config.authenticateOnInit=true] - If true or omitted, the SDK will automatically perform authentication during initialization using the provided credentials. If set to false, authentication will not be performed automatically; you must call {@link authorize} manually to obtain an access token.
   *
   * This option is useful for advanced scenarios where you want to handle authentication errors yourself, or delay authentication until a later point in your application flow.
   *
   * @throws {Error} Throws if required credentials are missing.
   *
   * @example
   * // Automatic authentication (default)
   * const sdk = new MarzbanSDK({
   *   baseUrl: 'https://api.example.com',
   *   username: 'admin',
   *   password: 'secret',
   * });
   *
   * // Manual authentication
   * const sdk = new MarzbanSDK({
   *   baseUrl: 'https://api.example.com',
   *   username: 'admin',
   *   password: 'secret',
   *   authenticateOnInit: false,
   * });
   * await sdk.authorize();
   */
  constructor(config: Config) {
    if (!config.username || !config.password) {
      throw new Error('No credentials provided for authentication')
    }

    this.configuration = new Configuration({
      basePath: config.baseUrl,
      username: config.username,
      password: config.password,
      accessToken: config.token,
    })

    this.client = createAxiosClient(config.baseUrl, { retries: config.retries })
    this.authService = new AuthService(this.configuration)

    this.admin = new AdminApi(this.configuration, config.baseUrl, this.client)
    this.core = new CoreApi(this.configuration, config.baseUrl, this.client)
    this.node = new NodeApi(this.configuration, config.baseUrl, this.client)
    this.user = new UserApi(this.configuration, config.baseUrl, this.client)
    this.system = new SystemApi(this.configuration, config.baseUrl, this.client)
    this.default = new DefaultApi(this.configuration, config.baseUrl, this.client)
    this.subscription = new SubscriptionApi(this.configuration, config.baseUrl, this.client)
    this.userTemplate = new UserTemplateApi(this.configuration, config.baseUrl, this.client)
    this.logs = new LogsApi(config.baseUrl, this.authService)

    setupInterceptors(this.client, this.authService, config)

    if (!config.token && config.authenticateOnInit !== false) {
      this.authService.authenticate(config.username, config.password)
    }
  }

  /**
   * Retrieves the current authentication token.
   *
   * @returns {Promise<string>} The JWT token currently in use, or empty string if no token is available.
   *
   * @example
   * const token = await sdk.getAuthToken();
   * // Use token for custom requests
   */
  async getAuthToken(): Promise<string> {
    await this.authService.waitForAuth()
    return this.authService.accessToken
  }

  /**
   * Explicitly performs user authentication using the username and password provided in the configuration.
   *
   * This method is useful if you want to manually control the authentication process and error handling, for example, when using the `authenticateOnInit: false` parameter in the SDK constructor.
   *
   * If authentication is already in progress, this method returns the current authentication promise. If authentication has already been completed, it will initiate a new authentication request (refresh the token).
   *
   * @param {boolean} [force=false] - If true, forces a new authentication request even if one is already in progress.
   * @returns {Promise<void>} A promise that resolves on successful authentication or rejects with an {@link AuthenticationError} on failure.
   *
   * @example
   * // Manual authentication with error handling
   * const sdk = new MarzbanSDK({
   *   baseUrl: 'https://api.example.com',
   *   username: 'admin',
   *   password: 'secret',
   *   authenticateOnInit: false,
   * });
   * try {
   *   await sdk.authorize();
   *   // Now you can perform authenticated requests
   * } catch (e) {
   *   if (e instanceof AuthenticationError) {
   *     // Handle authentication error
   *   }
   * }
   *
   * // Force re-authentication (e.g., after token expiration)
   * await sdk.authorize(true);
   */
  authorize(force = false): Promise<void> {
    if (this.authService.isAuthenticating && !force) {
      return this.authService.authPromise!
    }
    return this.authService.authenticate(this.configuration.username!, this.configuration.password!)
  }
}
