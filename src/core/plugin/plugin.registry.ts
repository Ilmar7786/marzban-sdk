import type { Logger } from '../logger'
import type {
  AuthFailureHandler,
  AuthPluginApi,
  AuthStartHandler,
  AuthSuccessHandler,
  ConfigView,
  ErrorMeta,
  HookOptions,
  HttpErrorHandler,
  HttpRequest,
  HttpRequestHandler,
  HttpResponse,
  HttpResponseHandler,
  Plugin,
  PluginContext,
  WebSocketCloseHandler,
  WebSocketConnectHandler,
  WebSocketMessageHandler,
} from './plugin.types'
import { InMemoryPluginStorage } from './storage'
import { safeCall, withTimeout } from './utils'

type Handler<F> = { fn: F; priority: number; once?: boolean; timeoutMs?: number; pluginName: string }

export class PluginRegistry {
  private plugins: Plugin[] = []
  private httpRequestHandlers: Handler<HttpRequestHandler>[] = []
  private httpResponseHandlers: Handler<HttpResponseHandler>[] = []
  private httpErrorHandlers: Handler<HttpErrorHandler>[] = []
  private wsConnectHandlers: Handler<WebSocketConnectHandler>[] = []
  private wsMessageHandlers: Handler<WebSocketMessageHandler>[] = []
  private wsCloseHandlers: Handler<WebSocketCloseHandler>[] = []
  private authStartHandlers: Handler<AuthStartHandler>[] = []
  private authSuccessHandlers: Handler<AuthSuccessHandler>[] = []
  private authFailureHandlers: Handler<AuthFailureHandler>[] = []

  private errorSubscribers: Array<(error: unknown, meta: ErrorMeta) => void> = []
  private shutdownController = new AbortController()

  // New fields for initialization management
  private initializationPromise: Promise<void> | null = null
  private isInitialized = false
  private initializationErrors: Array<{ plugin: string; error: unknown }> = []

  constructor(
    private baseContext: Omit<PluginContext, 'http' | 'ws' | 'auth' | 'onError'> & {
      logger: Logger
      auth: AuthPluginApi
    }
  ) {}

  get shutdownSignal(): AbortSignal {
    return this.shutdownController.signal
  }

  // New methods for initialization management
  get isReady(): boolean {
    return this.isInitialized
  }

  get hasErrors(): boolean {
    return this.initializationErrors.length > 0
  }

  get errors(): ReadonlyArray<{ plugin: string; error: unknown }> {
    return this.initializationErrors
  }

  // Main initialization method - now asynchronous
  async initialize(plugins: Plugin[], options?: { timeoutMs?: number }): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._initialize(plugins, options)
    return this.initializationPromise
  }

  private async _initialize(plugins: Plugin[], options?: { timeoutMs?: number }): Promise<void> {
    try {
      this.baseContext.logger.info(`Starting initialization of ${plugins.length} plugins...`)

      this.plugins = [...plugins].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
      this.initializationErrors = []

      // Initialize plugins with timeout
      const initPromises = this.plugins.map(async plugin => {
        try {
          const ctx = this.createContextFor(plugin)

          // Initialize enable with timeout
          if (plugin.enable) {
            await this.safeCallWithTimeout(
              () => plugin.enable!(ctx),
              options?.timeoutMs ?? 30000, // 30 seconds by default
              `enable for plugin ${plugin.name}`
            )
          }

          // Initialize onInit with timeout
          if (plugin.hooks?.onInit) {
            await this.safeCallWithTimeout(
              () => plugin.hooks!.onInit!(ctx),
              options?.timeoutMs ?? 30000,
              `onInit for plugin ${plugin.name}`
            )
          }

          this.baseContext.logger.info(`Plugin ${plugin.name} initialized successfully`)
        } catch (error) {
          const errorInfo = { plugin: plugin.name, error }
          this.initializationErrors.push(errorInfo)
          this.emitError(error, { phase: 'init', plugin: plugin.name, hook: 'enable' })
          this.baseContext.logger.error(`Plugin ${plugin.name} initialization failed:`, error)

          // Continue initialization of other plugins
        }
      })

      // Wait for all plugins to initialize
      await Promise.allSettled(initPromises)

      this.isInitialized = true
      this.baseContext.logger.info(
        `Initialization finished. ${this.plugins.length - this.initializationErrors.length}/${this.plugins.length} plugins ready`
      )
    } catch (error) {
      this.baseContext.logger.error('Critical plugin initialization error:', error)
      throw error
    }
  }

  // Simplified method for backward compatibility
  register(plugins: Plugin[]): void {
    // Start initialization in the background
    this.initialize(plugins).catch(error => {
      this.baseContext.logger.error('Plugin initialization error:', error)
    })
  }

  // New method to wait for readiness
  async waitForReady(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    if (this.initializationPromise) {
      await this.initializationPromise
    } else {
      throw new Error('Plugins have not been initialized. Call initialize() or register() first.')
    }
  }

  // Method to check readiness of a specific plugin
  isPluginReady(pluginName: string): boolean {
    return this.isInitialized && !this.initializationErrors.some(e => e.plugin === pluginName)
  }

  // Safe call with timeout
  private async safeCallWithTimeout<T>(fn: () => T | Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout ${operation} (${timeoutMs}ms)`)), timeoutMs)
    })

    return Promise.race([Promise.resolve(fn()), timeoutPromise])
  }

  subscribeErrors(cb: (error: unknown, meta: ErrorMeta) => void): void {
    this.errorSubscribers.push(cb)
  }

  private emitError(error: unknown, meta: ErrorMeta): void {
    for (const sub of this.errorSubscribers) {
      try {
        sub(error, meta)
      } catch {
        // noop
      }
    }
  }

  private add<T>(arr: Handler<T>[], pluginName: string, fn: T, pluginPriority: number, options?: HookOptions) {
    arr.push({
      fn,
      priority: options?.priority ?? pluginPriority,
      once: options?.once,
      timeoutMs: options?.timeoutMs,
      pluginName,
    })
    arr.sort((a, b) => a.priority - b.priority)
  }

  createContextFor(plugin: Plugin): PluginContext {
    const storage = new InMemoryPluginStorage()
    const pluginLogger: Logger = {
      debug: (m, t) => this.baseContext.logger.debug(m, t ?? `plugin:${plugin.name}`),
      info: (m, t) => this.baseContext.logger.info(m, t ?? `plugin:${plugin.name}`),
      warn: (m, t) => this.baseContext.logger.warn(m, t ?? `plugin:${plugin.name}`),
      error: (m, t) => this.baseContext.logger.error(m, t ?? `plugin:${plugin.name}`),
    }

    const http = {
      useRequest: (handler: HttpRequestHandler, options?: HookOptions) =>
        this.add(this.httpRequestHandlers, plugin.name, handler, plugin.priority ?? 0, options),
      useResponse: (handler: HttpResponseHandler, options?: HookOptions) =>
        this.add(this.httpResponseHandlers, plugin.name, handler, plugin.priority ?? 0, options),
      useError: (handler: HttpErrorHandler, options?: HookOptions) =>
        this.add(this.httpErrorHandlers, plugin.name, handler, plugin.priority ?? 0, options),
    }

    const ws = {
      useConnect: (handler: WebSocketConnectHandler, options?: HookOptions) =>
        this.add(this.wsConnectHandlers, plugin.name, handler, plugin.priority ?? 0, options),
      useMessage: (handler: WebSocketMessageHandler, options?: HookOptions) =>
        this.add(this.wsMessageHandlers, plugin.name, handler, plugin.priority ?? 0, options),
      useClose: (handler: WebSocketCloseHandler, options?: HookOptions) =>
        this.add(this.wsCloseHandlers, plugin.name, handler, plugin.priority ?? 0, options),
    }

    const auth = this.baseContext.auth

    const ctx: PluginContext = {
      sdkVersion: this.baseContext.sdkVersion,
      config: this.baseContext.config,
      logger: pluginLogger,
      storage,
      signals: { shutdown: this.shutdownSignal },
      http,
      ws,
      auth,
      onError: cb => this.subscribeErrors(cb),
    }
    return ctx
  }

  async notifyReady(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.hooks?.onReady) {
        const ctx = this.createContextFor(plugin)
        const res = await safeCall(() => plugin.hooks!.onReady!(ctx))
        if (!res.ok) this.emitError(res.error, { phase: 'ready', plugin: plugin.name, hook: 'onReady' })
      }
    }
  }

  async destroy(): Promise<void> {
    this.shutdownController.abort()
    for (const plugin of this.plugins) {
      if (plugin.disable) {
        const res = await safeCall(() => plugin.disable!(this.createContextFor(plugin)))
        if (!res.ok) this.emitError(res.error, { phase: 'shutdown', plugin: plugin.name, hook: 'disable' })
      }
    }
  }

  // Dispatchers
  async runHttpRequest(req: HttpRequest): Promise<HttpRequest> {
    let current = req
    for (const h of this.httpRequestHandlers) {
      const res = await safeCall(() => withTimeout(Promise.resolve(h.fn(current)), h.timeoutMs))
      if (!res.ok) {
        this.emitError(res.error, { phase: 'http', plugin: h.pluginName, hook: 'onHttpRequest' })
        continue
      }
      if (res.value) current = res.value
    }
    return current
  }

  async runHttpResponse(res: HttpResponse, req: HttpRequest): Promise<HttpResponse> {
    let current = res
    for (const h of this.httpResponseHandlers) {
      const r = await safeCall(() => withTimeout(Promise.resolve(h.fn(current, req)), h.timeoutMs))
      if (!r.ok) {
        this.emitError(r.error, { phase: 'http', plugin: h.pluginName, hook: 'onHttpResponse' })
        continue
      }
      if (r.value) current = r.value
    }
    return current
  }

  async runHttpError(error: unknown, req: HttpRequest): Promise<void> {
    for (const h of this.httpErrorHandlers) {
      const res = await safeCall(() => withTimeout(Promise.resolve(h.fn(error, req)), h.timeoutMs))
      if (!res.ok) {
        this.emitError(res.error, { phase: 'http', plugin: h.pluginName, hook: 'onHttpError' })
      }
    }
  }

  async runWsConnect(info: { url: string }): Promise<void> {
    for (const h of this.wsConnectHandlers) {
      const res = await safeCall(() => withTimeout(Promise.resolve(h.fn(info)), h.timeoutMs))
      if (!res.ok) {
        this.emitError(res.error, { phase: 'ws', plugin: h.pluginName, hook: 'onWsConnect' })
      }
    }
  }

  async runWsMessage(message: unknown, info: { url: string }): Promise<unknown> {
    let current = message
    for (const h of this.wsMessageHandlers) {
      const res = await safeCall(() => withTimeout(Promise.resolve(h.fn(current, info)), h.timeoutMs))
      if (!res.ok) {
        this.emitError(res.error, { phase: 'ws', plugin: h.pluginName, hook: 'onWsMessage' })
        continue
      }
      if (res.value) current = res.value
    }
    return current
  }

  async runWsClose(info: { url: string; code: number; reason?: string }): Promise<void> {
    for (const h of this.wsCloseHandlers) {
      const res = await safeCall(() => withTimeout(Promise.resolve(h.fn(info)), h.timeoutMs))
      if (!res.ok) {
        this.emitError(res.error, { phase: 'ws', plugin: h.pluginName, hook: 'onWsClose' })
      }
    }
  }

  async runAuthStart(): Promise<void> {
    for (const h of this.authStartHandlers) {
      const res = await safeCall(() => withTimeout(Promise.resolve(h.fn()), h.timeoutMs))
      if (!res.ok) {
        this.emitError(res.error, { phase: 'auth', plugin: h.pluginName, hook: 'onAuthStart' })
      }
    }
  }

  async runAuthSuccess(token: string): Promise<void> {
    for (const h of this.authSuccessHandlers) {
      const res = await safeCall(() => withTimeout(Promise.resolve(h.fn(token)), h.timeoutMs))
      if (!res.ok) {
        this.emitError(res.error, { phase: 'auth', plugin: h.pluginName, hook: 'onAuthSuccess' })
      }
    }
  }

  async runAuthFailure(error: unknown): Promise<void> {
    for (const h of this.authFailureHandlers) {
      const res = await safeCall(() => withTimeout(Promise.resolve(h.fn(error)), h.timeoutMs))
      if (!res.ok) {
        this.emitError(res.error, { phase: 'auth', plugin: h.pluginName, hook: 'onAuthFailure' })
      }
    }
  }

  // Cleanup handlers marked as 'once'
  private cleanupOnceHandlers() {
    this.httpRequestHandlers = this.httpRequestHandlers.filter(h => !h.once)
    this.httpResponseHandlers = this.httpResponseHandlers.filter(h => !h.once)
    this.httpErrorHandlers = this.httpErrorHandlers.filter(h => !h.once)
    this.wsConnectHandlers = this.wsConnectHandlers.filter(h => !h.once)
    this.wsMessageHandlers = this.wsMessageHandlers.filter(h => !h.once)
    this.wsCloseHandlers = this.wsCloseHandlers.filter(h => !h.once)
    this.authStartHandlers = this.authStartHandlers.filter(h => !h.once)
    this.authSuccessHandlers = this.authSuccessHandlers.filter(h => !h.once)
    this.authFailureHandlers = this.authFailureHandlers.filter(h => !h.once)
  }

  // Public method to cleanup once handlers
  cleanup(): void {
    this.cleanupOnceHandlers()
  }
}

export type RegistryBaseContext = {
  sdkVersion: string
  config: Readonly<ConfigView>
  logger: Logger
  auth: {
    getToken: () => Promise<string | null>
    refresh: () => Promise<void>
    on: (event: 'start' | 'success' | 'failure', cb: () => void) => () => void
  }
}
