# Система плагинов Marzban SDK

Система плагинов позволяет расширять функциональность SDK без изменения основного кода. Плагины могут перехватывать HTTP запросы/ответы, обрабатывать WebSocket события, реагировать на события аутентификации и выполнять другие задачи.

## 🏗️ Архитектура

### Основные принципы

1. **Простота**: Один способ регистрации обработчиков - через `enable(ctx)`
2. **Разделение ответственности**: `enable(ctx)` для регистрации, `hooks` для жизненного цикла
3. **Типобезопасность**: Полная поддержка TypeScript
4. **Кросс-платформенность**: Работает в браузере и Node.js

### Структура плагина

```typescript
interface Plugin {
  name: string // Уникальное имя плагина
  priority?: number // Приоритет выполнения (меньше = выше)

  enable?(ctx: PluginContext): void | Promise<void> // Регистрация обработчиков
  disable?(ctx: PluginContext): void | Promise<void> // Очистка при отключении

  hooks?: {
    onInit?(ctx: PluginContext): void | Promise<void> // ✅ С ctx для полного доступа к API!
    onReady?(ctx: PluginContext): void | Promise<void> // ✅ С ctx для полного доступа к API!
  }
}
```

````

## 🚀 Использование

### Создание плагина

```typescript
import type { Plugin } from '@marzban/sdk'

const myPlugin: Plugin = {
  name: 'my-plugin',
  priority: 50,

  enable(ctx) {
    // Регистрируем HTTP обработчики
    ctx.http.useRequest(req => {
      console.log(`Request: ${req.method} ${req.url}`)
      return req
    })

    ctx.http.useResponse((res, req) => {
      console.log(`Response: ${res.status} for ${req.method} ${req.url}`)
      return res
    })

    // Регистрируем WebSocket обработчики
    ctx.ws.useConnect(info => {
      console.log(`WS Connected: ${info.url}`)
    })

    // Регистрируем Auth обработчики
    ctx.auth.on('success', () => {
      console.log('Authentication successful')
    })
  },

  hooks: {
    onInit(ctx) {
      // ✅ Теперь у нас есть доступ к logger, storage, config!
      ctx.logger.info('Plugin initialized')
      ctx.storage.set('initTime', Date.now())
      ctx.logger.debug(`Config: ${ctx.config.baseUrl}`)
    },

    onReady(ctx) {
      // ✅ Полный доступ к API в onReady!
      ctx.logger.info('Plugin ready')
      ctx.storage.set('readyTime', Date.now())

      // Можно даже зарегистрировать дополнительные обработчики!
      ctx.http.useRequest(req => {
        ctx.logger.debug('Additional handler from onReady')
        return req
      })
    }
  }
}
````

### Подключение плагина

```typescript
import { MarzbanSDK } from '@marzban/sdk'
import { myPlugin } from './my-plugin'

const sdk = new MarzbanSDK({
  baseUrl: 'https://api.example.com',
  username: 'admin',
  password: 'secret',
  plugins: [myPlugin],
})
```

## 🔌 API плагинов

### PluginContext

Объект контекста, предоставляющий доступ к API SDK:

```typescript
interface PluginContext {
  readonly sdkVersion: string // Версия SDK
  readonly config: Readonly<ConfigView> // Конфигурация
  readonly logger: Logger // Логгер плагина
  readonly storage: PluginStorage // Хранилище плагина
  readonly signals: { shutdown: AbortSignal } // Сигналы

  http: HttpPluginApi // HTTP API
  ws: WebSocketPluginApi // WebSocket API
  auth: AuthPluginApi // Auth API
  onError: (cb: ErrorCallback) => void // Обработка ошибок
}
```

### HTTP API

```typescript
interface HttpPluginApi {
  useRequest(handler: HttpRequestHandler, options?: HookOptions): void
  useResponse(handler: HttpResponseHandler, options?: HookOptions): void
  useError(handler: HttpErrorHandler, options?: HookOptions): void
}

type HttpRequestHandler = (req: HttpRequest) => HttpRequest | void | Promise<HttpRequest | void>
type HttpResponseHandler = (res: HttpResponse, req: HttpRequest) => HttpResponse | void | Promise<HttpResponse | void>
type HttpErrorHandler = (error: unknown, req: HttpRequest) => void | Promise<void>
```

### WebSocket API

```typescript
interface WebSocketPluginApi {
  useConnect(handler: WebSocketConnectHandler, options?: HookOptions): void
  useMessage(handler: WebSocketMessageHandler, options?: HookOptions): void
  useClose(handler: WebSocketCloseHandler, options?: HookOptions): void
}

type WebSocketConnectHandler = (info: { url: string }) => void | Promise<void>
type WebSocketMessageHandler = (message: unknown, info: { url: string }) => unknown | void | Promise<unknown | void>
type WebSocketCloseHandler = (info: { url: string; code: number; reason?: string }) => void | Promise<void>
```

### Auth API

```typescript
interface AuthPluginApi {
  getToken(): Promise<string | null>
  refresh(): Promise<void>
  on(event: 'start' | 'success' | 'failure', cb: () => void): () => void
}
```

### HookOptions

```typescript
interface HookOptions {
  priority?: number // Приоритет обработчика (меньше = выше)
  once?: boolean // Выполнить только один раз
  timeoutMs?: number // Таймаут выполнения
}
```

## 📝 Примеры использования

### Логирование запросов

```typescript
const requestLoggerPlugin: Plugin = {
  name: 'request-logger',
  priority: 10,

  enable(ctx) {
    ctx.http.useRequest(req => {
      ctx.logger.info(`→ ${req.method} ${req.url}`)
      return req
    })

    ctx.http.useResponse((res, req) => {
      ctx.logger.info(`← ${res.status} ${req.method} ${req.url}`)
      return res
    })
  },
}
```

### Кэширование

```typescript
const cachePlugin: Plugin = {
  name: 'cache',
  priority: 20,

  enable(ctx) {
    const cache = new Map()

    ctx.http.useRequest(req => {
      if (req.method === 'GET' && cache.has(req.url)) {
        const cached = cache.get(req.url)
        if (Date.now() - cached.timestamp < 60000) {
          // 1 минута
          return { ...req, data: cached.data }
        }
      }
      return req
    })

    ctx.http.useResponse((res, req) => {
      if (req.method === 'GET' && res.status === 200) {
        cache.set(req.url, {
          data: res.data,
          timestamp: Date.now(),
        })
      }
      return res
    })
  },
}
```

### Мониторинг WebSocket

```typescript
const wsMonitorPlugin: Plugin = {
  name: 'ws-monitor',
  priority: 30,

  enable(ctx) {
    let connections = 0

    ctx.ws.useConnect(() => {
      connections++
      ctx.logger.info(`WebSocket connections: ${connections}`)
    })

    ctx.ws.useClose(() => {
      connections--
      ctx.logger.info(`WebSocket connections: ${connections}`)
    })
  },
}
```

## ⚡ Приоритеты и выполнение

### Порядок выполнения

1. Плагины сортируются по приоритету (меньше = выше)
2. Обработчики внутри каждого типа сортируются по приоритету
3. HTTP запросы/ответы выполняются последовательно
4. WebSocket и Auth события выполняются параллельно

### Рекомендуемые приоритеты

- **0-9**: Критические плагины (логирование, безопасность)
- **10-19**: Основные плагины (кэширование, метрики)
- **20-29**: Дополнительные плагины (мониторинг, аналитика)
- **30+**: Пользовательские плагины

## 🗄️ Хранилище плагинов

Каждый плагин имеет свое изолированное хранилище:

```typescript
enable(ctx) {
  // Сохраняем данные
  ctx.storage.set('counter', 0)
  ctx.storage.set('lastRequest', new Date())

  // Получаем данные
  const counter = ctx.storage.get<number>('counter')
  const lastRequest = ctx.storage.get<string>('lastRequest')

  // Удаляем данные
  ctx.storage.delete('counter')

  // Очищаем все
  ctx.storage.clear()
}
```

## 🚨 Обработка ошибок

### Регистрация обработчика ошибок

```typescript
enable(ctx) {
  ctx.onError((error, meta) => {
    console.error(`Plugin error in ${meta.plugin}:`, error)
    console.error('Phase:', meta.phase, 'Hook:', meta.hook)
  })
}
```

### Безопасное выполнение

Все обработчики выполняются в `try-catch` блоках. Ошибки логируются и не прерывают выполнение других плагинов.

## 🔄 Жизненный цикл

### Последовательность инициализации

1. **Создание SDK** → Плагины не активны
2. **Инициализация** → `plugin.hooks?.onInit(ctx)` (✅ С ctx для полного доступа к API!)
3. **Регистрация** → `plugin.enable(ctx)` (с ctx)
4. **Готовность** → `plugin.hooks?.onReady(ctx)` (✅ С ctx для полного доступа к API!)
5. **Работа** → Плагины активны и обрабатывают события
6. **Отключение** → `plugin.disable(ctx)` (с ctx)

### Очистка ресурсов

```typescript
disable(ctx) {
  // Очищаем таймеры
  clearInterval(this.intervalId)

  // Закрываем соединения
  this.connection?.close()

  // Очищаем хранилище
  ctx.storage.clear()
}
```

## 🧪 Тестирование

### Создание мок-контекста

```typescript
const mockContext: PluginContext = {
  sdkVersion: '1.0.0',
  config: { baseUrl: 'https://test.com' },
  logger: console,
  storage: new Map(),
  signals: { shutdown: new AbortController().signal },
  http: { useRequest: jest.fn(), useResponse: jest.fn(), useError: jest.fn() },
  ws: { useConnect: jest.fn(), useMessage: jest.fn(), useClose: jest.fn() },
  auth: { getToken: jest.fn(), refresh: jest.fn(), on: jest.fn() },
  onError: jest.fn(),
}

// Тестируем плагин
await myPlugin.enable?.(mockContext)
```

## 📚 Лучшие практики

### ✅ Рекомендуется

- Использовать `enable(ctx)` для регистрации обработчиков
- Использовать `hooks` только для жизненного цикла
- Устанавливать разумные приоритеты
- Обрабатывать ошибки в `onError`
- Очищать ресурсы в `disable`

### ❌ Не рекомендуется

- Дублировать функциональность в `hooks` и `enable`
- Использовать `hooks` для HTTP/WS/Auth обработчиков
- Игнорировать обработку ошибок
- Забывать об очистке ресурсов
- Устанавливать слишком высокие приоритеты

## 🔗 Связанные документы

- [Примеры плагинов](./PLUGIN_EXAMPLES.md)
- [API документация](./API_DOCUMENTATION.md)
- [WebSocket поддержка](./WEBSOCKET.md)
