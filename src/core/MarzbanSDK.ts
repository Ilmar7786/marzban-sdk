import { Config, validateConfig } from '@/config'
import { adminApi, coreApi, nodeApi, subscriptionApi, systemApi, userApi, userTemplateApi } from '@/gen/api'

import { AuthManager } from './auth'
import { configureHttpClient } from './http'
import { createLogger, Logger } from './logger'
import { WebhookManager } from './webhook'
import { LogsStream } from './ws'

export class MarzbanSDK {
  private readonly _config: Config
  private readonly _authService: AuthManager
  private readonly _logger: Logger

  readonly admin: adminApi
  readonly core: coreApi
  readonly node: nodeApi
  readonly user: userApi
  readonly system: systemApi
  readonly subscription: subscriptionApi
  readonly userTemplate: userTemplateApi
  readonly logs: LogsStream
  readonly webhook: WebhookManager

  constructor(config: Config) {
    this._config = validateConfig(config)
    this._logger = createLogger(this._config.logger)

    const storageAuth: AuthManager['storage'] = {
      username: this._config.username,
      password: this._config.password,
      accessToken: this._config?.token,
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
    this.logs = new LogsStream(this._config.baseUrl, this._authService, this._logger)
    this.webhook = new WebhookManager({ ...this._config.webhook, logger: this._logger })
  }

  async getAuthToken(): Promise<string> {
    await this._authService.waitForCurrentAuth()
    return this._authService.accessToken
  }

  authorize(force = false): Promise<void> {
    if (this._authService.isAuthenticating && !force) {
      return this._authService.authPromise!
    }
    return this._authService.authenticate(this._config.username, this._config.password)
  }

  async destroy(): Promise<void> {
    try {
      this.logs.closeAllConnections()
    } catch {
      // noop
    }
  }
}

export const createMarzbanSDK = async (config: Config): Promise<MarzbanSDK> => {
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

  return sdk
}
