import { Config, validateConfig } from '../config'
import { adminApi, base, coreApi, nodeApi, subscriptionApi, systemApi, userApi, userTemplateApi } from '../gen/api'
import { AuthManager } from './auth'
import { configureHttpClient } from './http'
import { createLogger, Logger } from './logger'
import { PluginManager } from './plugin'
import { WebhookManager } from './webhook'
import { LogsStream } from './ws'

/**
 * The main SDK class for interacting with the Marzban API.
 *
 * This class provides access to various API modules (e.g., Admin, Core, Node, etc.)
 * and handles authentication, request retries, and interceptor setup.
 */
export class MarzbanSDK {
  private _config: Config
  private _authService: AuthManager
  private _logger: Logger
  private _pluginManager: PluginManager

  /**
   * API module for administrative operations.
   */
  admin: ReturnType<typeof adminApi>

  /**
   * API module for core operations.
   */
  core: ReturnType<typeof coreApi>

  /**
   * API module for node-related operations.
   */
  node: ReturnType<typeof nodeApi>

  /**
   * API module for user-related operations.
   */
  user: ReturnType<typeof userApi>

  /**
   * API module for system-related operations.
   */
  system: ReturnType<typeof systemApi>

  /**
   * API module for default operations.
   */
  default: { base: typeof base }

  /**
   * API module for subscription-related operations.
   */
  subscription: ReturnType<typeof subscriptionApi>

  /**
   * API module for user template operations.
   */
  userTemplate: ReturnType<typeof userTemplateApi>

  /**
   * API module for logs-related operations.
   */
  logs: LogsStream

  webhook: WebhookManager

  /**
   * Instantiates the MarzbanSDK client for interacting with the Marzban API.
   *
   * @param {Config} config - The configuration object for the SDK.
   * @param {string} config.baseUrl - The base URL of the Marzban API.
   * @param {string} config.username - The username for authentication.
   * @param {string} config.password - The password for authentication.
   * @param {string} [config.token] - Optional JWT token for direct authorization if already authenticated.
   * @param {number} [config.timeout=0] - Optional HTTP timeout in seconds for requests.
   * @param {number} [config.retries=3] - Optional number of automatic retries for failed HTTP requests.
   * @param {boolean} [config.authenticateOnInit=true] - If true or omitted, the SDK will automatically perform authentication during initialization using the provided credentials. If set to false, authentication will not be performed automatically; you must call {@link authorize} manually to obtain an access token.
   * @param {import('./logger').LoggerConfig} [config.logger] - Logger configuration: `false` to disable logging, an options object to use the default logger, or a custom logger instance implementing the `Logger` interface.
   *
   * This option is useful for advanced scenarios where you want to handle authentication errors yourself, or delay authentication until a later point in your application flow.
   *
   * @throws {Error} Throws if required credentials are missing.
   *
   * @example
   * Automatic authentication (default)
   * const sdk = new MarzbanSDK({
   *   baseUrl: 'https://api.example.com',
   *   username: 'admin',
   *   password: 'secret',
   *   timeout: 15,
   *   retries: 5,
   *   logger: { level: 'info', timestamp: true },
   * });
   *
   * @example
   * Manual authentication with a custom logger implementation
   * const customLogger = {
   *   debug: (m) => console.debug(m),
   *   info: (m) => console.info(m),
   *   warn: (m) => console.warn(m),
   *   error: (m, t) => console.error(m, t),
   * };
   * const sdk = new MarzbanSDK({
   *   baseUrl: 'https://api.example.com',
   *   username: 'admin',
   *   password: 'secret',
   *   authenticateOnInit: false,
   *   logger: customLogger,
   * });
   * await sdk.authorize();
   */
  constructor(config: Config) {
    this._config = validateConfig(config)
    this._logger = createLogger(config.logger)
    this._authService = new AuthManager(this._config, this._logger)

    // Initialize plugins via manager
    this._pluginManager = new PluginManager(this._logger)
    const pluginRegistry = this._pluginManager.init(this._config.plugins, this._config, this._authService)

    configureHttpClient(config.baseUrl, this._authService, config, this._logger, pluginRegistry)

    this.admin = adminApi()
    this.core = coreApi()
    this.node = nodeApi()
    this.user = userApi()
    this.system = systemApi()
    this.default = { base }
    this.subscription = subscriptionApi()
    this.userTemplate = userTemplateApi()
    this.logs = new LogsStream(config.baseUrl, this._authService, this._logger, pluginRegistry)
    this.webhook = new WebhookManager({
      logger: this._logger,
      ...config.webhook,
    })
  }

  /**
   * Retrieves the current authentication token.
   *
   * @returns {Promise<string>} The JWT token currently in use, or empty string if no token is available.
   *
   * @example
   * const token = await sdk.getAuthToken();
   * Use token for custom requests
   */
  async getAuthToken(): Promise<string> {
    await this._authService.waitForCurrentAuth()
    return this._authService.accessToken
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
   * Manual authentication with error handling
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
   * Force re-authentication (e.g., after token expiration)
   * await sdk.authorize(true);
   */
  authorize(force = false): Promise<void> {
    if (this._authService.isAuthenticating && !force) {
      return this._authService.authPromise!
    }
    return this._authService.authenticate(this._config.username, this._config.password)
  }

  /**
   * Checks whether the plugins are ready to work.
   *
   * @returns boolean - true if all plugins are initialized
   */
  arePluginsReady(): boolean {
    return this._pluginManager?.isReady() ?? false
  }

  /**
   * Checks for errors in plugins.
   *
   * @returns boolean - true if there are initialization errors
   */
  hasPluginErrors(): boolean {
    return this._pluginManager?.hasErrors() ?? false
  }

  /**
   * Gets a list of plugin initialization errors.
   *
   * @returns Array<{plugin: string, error: unknown}> - error list
   */
  getPluginErrors(): ReadonlyArray<{ plugin: string; error: unknown }> {
    return this._pluginManager?.getErrors() ?? []
  }

  /**
   * Waits for all plugins to be ready.
   *
   * @returns Promise<void> - resolves when all plugins are ready
   */
  async waitForPlugins(): Promise<void> {
    await this._pluginManager?.waitForReady()
  }

  /**
   * Checks the availability of a specific plugin.
   *
   * @returns boolean - true if the plugin is ready
   */
  isPluginReady(pluginName: string): boolean {
    return this._pluginManager?.isPluginReady(pluginName) ?? false
  }

  async destroy(): Promise<void> {
    try {
      this.logs.closeAllConnections()
    } catch {
      // noop
    }
    await this._pluginManager.destroy()
  }
}

export const createMarzbanSDK = async (
  config: Config,
  options?: {
    waitForPlugins?: boolean // Whether to wait for plugin initialization
  }
): Promise<MarzbanSDK> => {
  const logger = createLogger(config.logger)
  const sdk = new MarzbanSDK(config)

  // --- Authentication ---
  if (config.authenticateOnInit) {
    logger.info('Performing initial authentication as configured', 'MarzbanSDK')
    await sdk['_authService'].authenticate(config.username, config.password)
    logger.info('Initial authentication completed successfully', 'MarzbanSDK')
  } else {
    logger.debug('Skipping initial authentication as configured', 'MarzbanSDK')
  }

  // --- Plugin initialization ---
  if (sdk['_pluginManager']) {
    if (options?.waitForPlugins) {
      logger.info('Waiting for plugins to initialize...', 'MarzbanSDK')
      await sdk['_pluginManager'].notifyReady()
      logger.info('All plugins initialized successfully', 'MarzbanSDK')
    } else {
      // fire-and-forget, we are not blocking the SDK
      sdk['_pluginManager'].notifyReadyUnsafe()
    }
  }

  return sdk
}
