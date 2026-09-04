import { Config, validateConfig, ValidatedConfig } from '@/config'
import { adminApi, coreApi, nodeApi, subscriptionApi, systemApi, userApi, userTemplateApi } from '@/gen/api'

import { AuthManager } from './auth'
import { SdkError } from './errors'
import { configureHttpClient } from './http'
import { Lifecycle } from './lifecycle'
import { createLogger, Logger } from './logger'
import { TolerantUserApi } from './quirks/tolerant-user-api'
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
  private readonly _lifecycle: Lifecycle
  private _destroyPromise: Promise<void> | null = null

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
   *
   * `removeUser` tolerates the Marzban panel-side 500 that follows a
   * successful delete — see docs/marzban-quirks.md.
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
    this._lifecycle = new Lifecycle()

    const storageAuth: AuthManager['storage'] = {
      username: this._config.username,
      password: this._config.password,
      accessToken: this._config.token,
    }
    this._authService = new AuthManager(storageAuth, this._logger, this._lifecycle)

    const http = configureHttpClient(this._config.baseUrl, this._authService, this._config, this._logger)
    this._authService.setPublicClient(http.publicClient)

    this.admin = new adminApi({ client: http.client })
    this.core = new coreApi({ client: http.client })
    this.node = new nodeApi({ client: http.client })
    this.user = new TolerantUserApi({ client: http.client })
    this.system = new systemApi({ client: http.client })
    this.subscription = new subscriptionApi({ client: http.client })
    this.userTemplate = new userTemplateApi({ client: http.client })
    this.logs = new LogsStream({
      basePath: this._config.baseUrl,
      authService: this._authService,
      logger: this._logger,
      httpsAgent: this._config.httpsAgent,
      lifecycle: this._lifecycle,
    })
    this.webhook = new WebhookManager({ ...this._config.webhook, logger: this._logger, lifecycle: this._lifecycle })

    this._logger.debug('MarzbanSDK instance created', 'MarzbanSDK')
  }

  /**
   * Returns the current authentication token.
   *
   * Waits for any in-progress authentication, then returns the JWT token in use (or empty string if none).
   *
   * @returns {Promise<string>} The current JWT token.
   * @throws {SdkDestroyedError} If the SDK has been destroyed.
   *
   * @example
   * const token = await sdk.getAuthToken();
   * console.log(`Token: ${token}`);
   */
  async getAuthToken(): Promise<string> {
    this._lifecycle.assertActive('getAuthToken')
    await this._authService.waitForCurrentAuth()
    return this._authService.accessToken
  }

  /**
   * Performs user authentication with stored credentials.
   *
   * If a login is already in progress, returns the existing promise (deduplicates concurrent calls).
   *
   * @returns {Promise<void>} Resolves on successful authentication; rejects with {@link AuthError} on failure.
   * @throws {SdkDestroyedError} If the SDK has been destroyed.
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
    this._lifecycle.assertActive('authorize')
    // Concurrent-call de-duplication is handled inside AuthManager.authenticate,
    // which returns the in-flight promise when a login is already running.
    return this._authService.authenticate(this._config.username, this._config.password)
  }

  /**
   * Releases resources held by the SDK and enters a terminal `destroyed`
   * state. Idempotent — calling it again after the first call returns the
   * same promise and starts no new work.
   *
   * From the point `destroy()` is called, every other public operation on
   * this instance — `authorize()`, `getAuthToken()`, `logs.connect*()`, and
   * `webhook.parseWebhook()`/`handleWebhook()`/`dispatch()` — rejects with
   * `SdkDestroyedError`. `webhook.on()`/`once()`/`off()` keep working, so
   * unsubscribing after shutdown stays safe. Direct API calls (`sdk.user.*`,
   * `sdk.node.*`, …) are not rejected by this method: the stored access token
   * is cleared, so such a call fails with the panel's own 401 instead once
   * re-authentication is attempted and rejected as above. An HTTP request
   * already in flight when `destroy()` is called is not cancelled.
   *
   * Runs three independent cleanup steps — closing active WebSocket log
   * streams, clearing webhook listeners, and clearing the stored access
   * token — each wrapped so a throw from one never skips the others; every
   * failure is logged and swallowed.
   *
   * Does not touch `httpAgent`/`httpsAgent` from {@link Config} — the SDK
   * never creates that agent, so it doesn't own or destroy it either;
   * callers that supplied one are responsible for its lifecycle.
   *
   * @returns {Promise<void>} Resolves once cleanup has completed.
   */
  destroy(): Promise<void> {
    if (!this._destroyPromise) {
      this._destroyPromise = this.destroyInternal()
    }
    return this._destroyPromise
  }

  private async destroyInternal(): Promise<void> {
    this._logger.info('Destroying SDK and closing active connections', 'MarzbanSDK')

    // Marked first, before any cleanup step runs, so a 403 reconnect or any
    // other pending operation observes the destroyed state at its next
    // checkpoint instead of racing shutdown to completion.
    this._lifecycle.markDestroyed()

    this.runCleanupStep(() => this.logs.closeAllConnections())
    this.runCleanupStep(() => this.webhook.close())
    this.runCleanupStep(() => this._authService.close())
  }

  /** Runs one independent destroy step, logging rather than throwing if it fails — so the others still run. */
  private runCleanupStep(step: () => void): void {
    try {
      step()
    } catch (err) {
      if (err instanceof SdkError) {
        this._logger.error(err.message, err.stack, err.code)
      } else if (err instanceof Error) {
        this._logger.error(err.message, err.stack, 'MarzbanSDK')
      } else {
        this._logger.error('Failed to clean up during destroy', err, 'MarzbanSDK')
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
