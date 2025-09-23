import { AnyType } from '../../common'
import type { Config } from '../../config'
import type { AuthManager } from '../auth'
import type { Logger } from '../logger'
import { PluginRegistry, type RegistryBaseContext } from './plugin.registry'
import type { ConfigView, Plugin } from './plugin.types'

export class PluginManager {
  private registry: PluginRegistry | undefined

  constructor(private readonly logger: Logger) {}

  // Synchronous initialization (for backward compatibility)
  init(plugins: Plugin[] | undefined, config: Config, auth: AuthManager): PluginRegistry | undefined {
    if (!plugins || plugins.length === 0) return undefined

    const cfgView: ConfigView = Object.freeze({
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      retries: config.retries,
    })

    const baseContext: RegistryBaseContext = {
      config: cfgView,
      logger: this.logger,
      auth: {
        getToken: async () => (auth.accessToken ? auth.accessToken : null),
        refresh: async () => {
          await auth.authenticate(config.username, config.password)
        },
        on: (event, cb) => {
          auth.on(event as AnyType, cb as AnyType)
        },
      },
    }

    this.registry = new PluginRegistry(baseContext as AnyType)
    // Starting initialization in the background
    this.registry.register(plugins)

    return this.registry
  }

  // Asynchronous initialization with waiting
  async initAsync(
    plugins: Plugin[] | undefined,
    config: Config,
    auth: AuthManager,
    options?: { timeoutMs?: number }
  ): Promise<PluginRegistry | undefined> {
    if (!plugins || plugins.length === 0) return undefined

    const cfgView: ConfigView = Object.freeze({
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      retries: config.retries,
    })

    const baseContext: RegistryBaseContext = {
      config: cfgView,
      logger: this.logger,
      auth: {
        getToken: async () => (auth.accessToken ? auth.accessToken : null),
        refresh: async () => {
          await auth.authenticate(config.username, config.password)
        },
        on: (event, cb) => {
          auth.on(event as AnyType, cb as AnyType)
        },
      },
    }

    this.registry = new PluginRegistry(baseContext as AnyType)

    // Wait for full initialization
    await this.registry.initialize(plugins, options)

    return this.registry
  }

  getRegistry(): PluginRegistry | undefined {
    return this.registry
  }

  // Check if plugins are ready
  isReady(): boolean {
    return (this.registry?.isReady && !this.registry?.hasErrors) ?? false
  }

  // Check if there are any errors
  hasErrors(): boolean {
    return this.registry?.hasErrors ?? false
  }

  // Get initialization errors
  getErrors(): ReadonlyArray<{ plugin: string; error: unknown }> {
    return this.registry?.errors ?? []
  }

  // Wait for plugins to be ready
  async waitForReady(): Promise<void> {
    await this.registry?.waitForReady()
  }

  // Check readiness of a specific plugin
  isPluginReady(pluginName: string): boolean {
    return this.registry?.isPluginReady(pluginName) ?? false
  }

  async notifyReady(): Promise<void> {
    // Make sure plugins are initialized
    await this.waitForReady()
    await this.registry?.notifyReady()
  }

  notifyReadyUnsafe(): void {
    this.registry?.notifyReady().catch(err => {
      this.logger.warn(`Plugin notifyReady failed: ${err}`)
    })
  }

  async destroy(): Promise<void> {
    await this.registry?.destroy()
  }
}
