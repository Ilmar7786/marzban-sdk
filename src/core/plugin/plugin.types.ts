import type { Logger } from '../logger'

export interface Plugin {
  name: string
  priority?: number
  enable?(ctx: PluginContext): void | Promise<void>
  disable?(ctx: PluginContext): void | Promise<void>
  hooks?: {
    onInit?(ctx: PluginContext): void | Promise<void>
    onReady?(ctx: PluginContext): void | Promise<void>
  }
}

// Убрал все HTTP/WS/Auth хуки - они регистрируются через enable(ctx)
// Оставил только жизненный цикл

export interface ConfigView {
  baseUrl: string
  timeout?: number
  retries?: number
}

export interface AuthPluginApi {
  getToken(): Promise<string | null>
  refresh(): Promise<void>
  on(event: 'start' | 'success' | 'failure', cb: () => void): () => void
}

// Отдельные типы для каждого вида обработчика
export type HttpRequestHandler = (req: HttpRequest) => HttpRequest | void | Promise<HttpRequest | void>
export type HttpResponseHandler = (
  res: HttpResponse,
  req: HttpRequest
) => HttpResponse | void | Promise<HttpResponse | void>
export type HttpErrorHandler = (error: unknown, req: HttpRequest) => void | Promise<void>

export type WebSocketConnectHandler = (info: { url: string }) => void | Promise<void>
export type WebSocketMessageHandler = (
  message: unknown,
  info: { url: string }
) => unknown | void | Promise<unknown | void>
export type WebSocketCloseHandler = (info: { url: string; code: number; reason?: string }) => void | Promise<void>

export type AuthStartHandler = () => void | Promise<void>
export type AuthSuccessHandler = (token: string) => void | Promise<void>
export type AuthFailureHandler = (error: unknown) => void | Promise<void>

export interface HttpPluginApi {
  useRequest(handler: HttpRequestHandler, options?: HookOptions): void
  useResponse(handler: HttpResponseHandler, options?: HookOptions): void
  useError(handler: HttpErrorHandler, options?: HookOptions): void
}

export interface WebSocketPluginApi {
  useConnect(handler: WebSocketConnectHandler, options?: HookOptions): void
  useMessage(handler: WebSocketMessageHandler, options?: HookOptions): void
  useClose(handler: WebSocketCloseHandler, options?: HookOptions): void
}

export interface HookOptions {
  priority?: number
  once?: boolean
  timeoutMs?: number
}

export interface PluginStorage {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  delete(key: string): void
  clear(): void
}

export interface ErrorMeta {
  phase: 'init' | 'ready' | 'http' | 'ws' | 'auth' | 'shutdown'
  plugin?: string
  hook?: string
}

export interface PluginContext {
  readonly sdkVersion: string
  readonly config: Readonly<ConfigView>
  readonly logger: Logger
  readonly storage: PluginStorage
  readonly signals: { shutdown: AbortSignal }

  http: HttpPluginApi
  ws: WebSocketPluginApi
  auth: AuthPluginApi
  onError: (cb: (error: unknown, meta: ErrorMeta) => void) => void
}

export type HttpRequest = {
  url?: string
  method?: string
  headers?: Record<string, string>
  data?: unknown
  meta?: Record<string, unknown>
}

export type HttpResponse = {
  status: number
  data: unknown
  headers?: Record<string, string>
}
