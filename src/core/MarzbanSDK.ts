import { Config, validateConfig, ValidatedConfig } from '@/config'
import { adminApi, coreApi, nodeApi, subscriptionApi, systemApi, userApi, userTemplateApi } from '@/gen/api'

import { AuthManager } from './auth'
import { SdkError } from './errors'
import { configureHttpClient } from './http'
import { createLogger, Logger } from './logger'
import { WebhookManager } from './webhook'
import { LogsStream } from './ws'

/**
 * Main SDK class for interacting with the Marzban API.
 *
 * Provides access to API modules (AdminApi, CoreApi, etc.) and handles authentication, retries, and interceptors.
 */
export class MarzbanSDK {
  private readonly _config: ValidatedConfig
  private readonly _authService: AuthManager
  private readonly _logger: Logger

  /**
   * Administrative API endpoints.
   */
  readonly admin: adminApi

  /**
   * Core API endpoints.
   */
  readonly core: coreApi

  /**
   * Node management API endpoints.
   */
  readonly node: nodeApi

  /**
   * User management API endpoints.
   */
  readonly user: userApi

  /**
   * System API endpoints.
   */
  readonly system: systemApi

  /**
   * Subscription management API endpoints.
   */
  readonly subscription: subscriptionApi

  /**
   * User template API endpoints.
   */
  readonly userTemplate: userTemplateApi

  /**
   * Real-time logs streaming.
   */
  readonly logs: LogsStream

  /**
   * Webhook manager for validating, parsing, and handling incoming webhooks.
   *
   * Provides:
   * - Webhook signature verification
   * - Payload validation
   * - Typed event subscriptions
   * - Wildcard and batch event handling
   * - Manual event dispatching
   *
   * The webhook manager can be used to:
   * - Handle incoming HTTP webhook requests
   * - Subscribe to specific webhook events
   * - Verify webhook authenticity using a secret
   * - Process webhook batches
   *
   * @example
   * sdk.webhook.on('user_created', payload => {
   *   console.log(payload.username)
   * })
   *
   * @example
   * // Express.js integration
   * app.post('/webhook', async (req, res) => {
   *   await sdk.webhook.handleWebhook(
   *     req.body,
   *     req.headers['x-signature']
   *   )
   *
   *   res.sendStatus(200)
   * })
   */
  readonly webhook: WebhookManager

  /**
   * Creates an instance of MarzbanSDK.
   *
   * Prefer the {@link createMarzbanSDK} factory, which also authenticates on
   * init when configured. The config is validated here, so constructing
   * directly is safe too.
   *
   * @param {Config} config - Configuration object for the SDK.
   * @throws {ConfigurationError} If the configuration fails schema validation.
   *
   * @example
   * // Automatic authentication (default)
   * const sdk = await createMarzbanSDK({
   *   baseUrl: 'https://api.example.com',
   *   username: 'admin',
   *   password: 'secret',
   * });
   *
   * @example
   * // Manual authentication mode
   * const sdk = await createMarzbanSDK({
   *   baseUrl: 'https://api.example.com',
   *   username: 'admin',
   *   password: 'secret',
   *   authenticateOnInit: false,
   * });
   * await sdk.authorize();
   */
  constructor(config: Config) {
    this._config = validateConfig(config)
    this._logger = createLogger(this._config.logger)

    const storageAuth: AuthManager['storage'] = {
      username: this._config.username,
      password: this._config.password,
      accessToken: this._config.token,
    }
    this._authService = new AuthManager(storageAuth, this._logger)

    const http = configureHttpClient(this._config.baseUrl, this._authService, this._config, this._logger)
    this._authService.setPublicClient(http.publicClient)

    this.admin = new adminApi({ client: http.client })
    this.core = new coreApi({ client: http.client })
    this.node = new nodeApi({ client: http.client })
    this.user = new userApi({ client: http.client })
    this.system = new systemApi({ client: http.client })
    this.subscription = new subscriptionApi({ client: http.client })
    this.userTemplate = new userTemplateApi({ client: http.client })
    this.logs = new LogsStream(this._config.baseUrl, this._authService, this._logger, this._config.retries)
    this.webhook = new WebhookManager({ ...this._config.webhook, logger: this._logger })
  }

  /**
   * Returns the current authentication token.
   *
   * Waits for any in-progress authentication, then returns the JWT token in use (or empty string if none).
   *
   * @returns {Promise<string>} The current JWT token.
   *
   * @example
   * const token = await sdk.getAuthToken();
   * console.log(`Token: ${token}`);
   */
  async getAuthToken(): Promise<string> {
    await this._authService.waitForCurrentAuth()
    return this._authService.accessToken
  }

  /**
   * Performs user authentication with stored credentials.
   *
   * If a login is already in progress, returns the existing promise (deduplicates concurrent calls).
   *
   * @returns {Promise<void>} Resolves on successful authentication; rejects with {@link AuthError} on failure.
   *
   * @example
   * try {
   *   await sdk.authorize();
   *   // Auth successful
   * } catch (e) {
   *   if (e instanceof AuthError) {
   *     // Handle auth error
   *   }
   * }
   */
  authorize(): Promise<void> {
    // Concurrent-call de-duplication is handled inside AuthManager.authenticate,
    // which returns the in-flight promise when a login is already running.
    return this._authService.authenticate(this._config.username, this._config.password)
  }

  /**
   * Releases resources held by the SDK.
   *
   * Closes all active WebSocket log streams. Safe to call multiple times;
   * any error while closing connections is logged and swallowed.
   *
   * @returns {Promise<void>} Resolves once cleanup has completed.
   */
  async destroy(): Promise<void> {
    try {
      this.logs.closeAllConnections()
    } catch (err) {
      if (err instanceof SdkError) {
        this._logger.error(err.message, err.stack, err.code)
      } else if (err instanceof Error) {
        this._logger.error(err.message, err.stack, 'MarzbanSDK')
      } else {
        this._logger.error('Failed to close connections during destroy', err, 'MarzbanSDK')
      }
    }
  }
}

export const createMarzbanSDK = async (config: Config): Promise<MarzbanSDK> => {
  const validatedConfig = validateConfig(config)
  const sdk = new MarzbanSDK(validatedConfig)

  if (validatedConfig.authenticateOnInit) {
    await sdk.authorize()
  }

  return sdk
}
