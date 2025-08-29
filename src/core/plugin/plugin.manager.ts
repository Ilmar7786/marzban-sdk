/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Config } from '../../config'
import type { AuthManager } from '../auth'
import type { Logger } from '../logger'
import { PluginRegistry, type RegistryBaseContext } from './plugin.registry'
import type { ConfigView, Plugin } from './plugin.types'

export class PluginManager {
  private registry: PluginRegistry | undefined

  constructor(private readonly logger: Logger) {}

  // Синхронная инициализация (для обратной совместимости)
  init(plugins: Plugin[] | undefined, config: Config, auth: AuthManager): PluginRegistry | undefined {
    if (!plugins || plugins.length === 0) return undefined

    const cfgView: ConfigView = Object.freeze({
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      retries: config.retries,
    })

    const baseContext: RegistryBaseContext = {
      sdkVersion: '1.0.0',
      config: cfgView,
      logger: this.logger,
      auth: {
        getToken: async () => (auth.accessToken ? auth.accessToken : null),
        refresh: async () => {
          await auth.authenticate(config.username, config.password)
        },
        on: (event, cb) => auth.on(event as any, cb as any),
      },
    }

    this.registry = new PluginRegistry(baseContext as any)
    // Запускаем инициализацию в фоне
    this.registry.register(plugins)

    return this.registry
  }

  // Асинхронная инициализация с ожиданием
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
      sdkVersion: '1.0.0',
      config: cfgView,
      logger: this.logger,
      auth: {
        getToken: async () => (auth.accessToken ? auth.accessToken : null),
        refresh: async () => {
          await auth.authenticate(config.username, config.password)
        },
        on: (event, cb) => auth.on(event as any, cb as any),
      },
    }

    this.registry = new PluginRegistry(baseContext as any)

    // Ждем полной инициализации
    await this.registry.initialize(plugins, options)

    return this.registry
  }

  getRegistry(): PluginRegistry | undefined {
    return this.registry
  }

  // Проверка готовности плагинов
  isReady(): boolean {
    return this.registry?.isReady ?? false
  }

  // Проверка наличия ошибок
  hasErrors(): boolean {
    return this.registry?.hasErrors ?? false
  }

  // Получение ошибок инициализации
  getErrors(): ReadonlyArray<{ plugin: string; error: unknown }> {
    return this.registry?.errors ?? []
  }

  // Ожидание готовности плагинов
  async waitForReady(): Promise<void> {
    await this.registry?.waitForReady()
  }

  // Проверка готовности конкретного плагина
  isPluginReady(pluginName: string): boolean {
    return this.registry?.isPluginReady(pluginName) ?? false
  }

  async notifyReady(): Promise<void> {
    // Убеждаемся, что плагины инициализированы
    await this.waitForReady()
    await this.registry?.notifyReady()
  }

  async destroy(): Promise<void> {
    await this.registry?.destroy()
  }
}
