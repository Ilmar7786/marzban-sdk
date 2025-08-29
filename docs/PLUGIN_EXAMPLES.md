# Примеры плагинов для Marzban SDK

Этот документ содержит практические примеры плагинов для различных сценариев использования.

## Базовые плагины

### 1. Плагин логирования запросов

```typescript
import type { Plugin } from 'marzban-sdk'

export const requestLoggerPlugin: Plugin = {
  name: 'request-logger',
  version: '1.0.0',
  priority: 10,

  hooks: {
    onInit(ctx) {
      ctx.logger.info('Request Logger Plugin инициализирован')
    },

    onHttpRequest(req) {
      ctx.logger.info(`→ ${req.method || 'GET'} ${req.url}`)
      return req
    },

    onHttpResponse(res, req) {
      const statusColor = res.status >= 400 ? 'error' : res.status >= 300 ? 'warn' : 'info'
      ctx.logger[statusColor](`← ${res.status} ${req.method || 'GET'} ${req.url}`)
      return res
    },

    onHttpError(error, req) {
      ctx.logger.error(`✗ ${req.method || 'GET'} ${req.url}:`, error)
    },
  },
}
```

### 2. Плагин для добавления заголовков

```typescript
import type { Plugin } from 'marzban-sdk'

export const headersPlugin: Plugin = {
  name: 'headers',
  version: '1.0.0',
  priority: 20,

  hooks: {
    onHttpRequest(req) {
      return {
        ...req,
        headers: {
          ...req.headers,
          'User-Agent': 'MarzbanSDK/1.0.0',
          'X-Request-ID': crypto.randomUUID(),
          'X-Plugin': 'headers',
        },
      }
    },
  },
}
```

### 3. Плагин для кэширования

```typescript
import type { Plugin } from 'marzban-sdk'

interface CacheEntry {
  data: unknown
  timestamp: number
  ttl: number
}

export const cachePlugin: Plugin = {
  name: 'cache',
  version: '1.0.0',
  priority: 30,

  hooks: {
    onInit(ctx) {
      ctx.storage.set('cache', new Map<string, CacheEntry>())
      ctx.logger.info('Cache Plugin инициализирован')
    },

    onHttpRequest(req) {
      // Кэшируем только GET запросы
      if (req.method !== 'GET') return req

      const cache = ctx.storage.get<Map<string, CacheEntry>>('cache')
      const key = `${req.method}:${req.url}`
      const entry = cache?.get(key)

      if (entry && Date.now() - entry.timestamp < entry.ttl) {
        ctx.logger.debug(`Cache hit: ${req.url}`)
        return { ...req, meta: { ...req.meta, cached: true, cacheKey: key } }
      }

      return req
    },

    onHttpResponse(res, req) {
      if (req.meta?.cached) return res

      const cache = ctx.storage.get<Map<string, CacheEntry>>('cache')
      const key = req.meta?.cacheKey || `${req.method}:${req.url}`

      // Кэшируем только успешные ответы
      if (res.status === 200 && req.method === 'GET') {
        cache?.set(key, {
          data: res.data,
          timestamp: Date.now(),
          ttl: 60000, // 1 минута
        })
        ctx.logger.debug(`Cached: ${req.url}`)
      }

      return res
    },
  },
}
```

## Плагины для мониторинга

### 4. Плагин метрик

```typescript
import type { Plugin } from 'marzban-sdk'

interface Metrics {
  requests: number
  responses: number
  errors: number
  startTime: number
  slowRequests: number
}

export const metricsPlugin: Plugin = {
  name: 'metrics',
  version: '1.0.0',
  priority: 40,

  hooks: {
    onInit(ctx) {
      ctx.storage.set('metrics', {
        requests: 0,
        responses: 0,
        errors: 0,
        startTime: Date.now(),
        slowRequests: 0,
      })
      ctx.logger.info('Metrics Plugin инициализирован')
    },

    onHttpRequest(req) {
      const metrics = ctx.storage.get<Metrics>('metrics')
      metrics.requests++
      ctx.storage.set(`req-${req.url}`, Date.now())
      return req
    },

    onHttpResponse(res, req) {
      const metrics = ctx.storage.get<Metrics>('metrics')
      const startTime = ctx.storage.get<number>(`req-${req.url}`)

      metrics.responses++

      if (startTime) {
        const duration = Date.now() - startTime
        if (duration > 1000) {
          // Медленные запросы > 1 сек
          metrics.slowRequests++
          ctx.logger.warn(`Медленный запрос: ${req.url} (${duration}ms)`)
        }
        ctx.storage.delete(`req-${req.url}`)
      }

      return res
    },

    onHttpError(error, req) {
      const metrics = ctx.storage.get<Metrics>('metrics')
      metrics.errors++
      ctx.storage.delete(`req-${req.url}`)
    },

    onReady(ctx) {
      const metrics = ctx.storage.get<Metrics>('metrics')
      const uptime = Date.now() - metrics.startTime
      ctx.logger.info(
        `Метрики за ${uptime}ms: ${metrics.requests} запросов, ${metrics.responses} ответов, ${metrics.errors} ошибок, ${metrics.slowRequests} медленных`
      )
    },
  },
}
```

### 5. Плагин для мониторинга WebSocket

```typescript
import type { Plugin } from 'marzban-sdk'

interface WSStats {
  connections: number
  messages: number
  disconnections: number
  errors: number
}

export const wsMonitorPlugin: Plugin = {
  name: 'ws-monitor',
  version: '1.0.0',
  priority: 50,

  hooks: {
    onInit(ctx) {
      ctx.storage.set('ws-stats', {
        connections: 0,
        messages: 0,
        disconnections: 0,
        errors: 0,
      })
      ctx.logger.info('WebSocket Monitor Plugin инициализирован')
    },

    onWsConnect(info) {
      const stats = ctx.storage.get<WSStats>('ws-stats')
      stats.connections++
      ctx.logger.info(`WebSocket подключен: ${info.url} (всего: ${stats.connections})`)
    },

    onWsMessage(message, info) {
      const stats = ctx.storage.get<WSStats>('ws-stats')
      stats.messages++

      if (stats.messages % 100 === 0) {
        ctx.logger.debug(`WebSocket сообщений: ${stats.messages}`)
      }

      return message
    },

    onWsClose(info) {
      const stats = ctx.storage.get<WSStats>('ws-stats')
      stats.disconnections++
      ctx.logger.info(`WebSocket отключен: ${info.url} (код: ${info.code}, причина: ${info.reason})`)
    },
  },
}
```

## Плагины для безопасности

### 6. Плагин для валидации токенов

```typescript
import type { Plugin } from 'marzban-sdk'

export const tokenValidatorPlugin: Plugin = {
  name: 'token-validator',
  version: '1.0.0',
  priority: 100,

  hooks: {
    onAuthSuccess(token) {
      // Проверяем формат токена
      if (!token || token.length < 10) {
        throw new Error('Invalid token format')
      }

      // Проверяем, что токен не истек
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          throw new Error('Token expired')
        }
      } catch (error) {
        ctx.logger.warn('Token validation failed:', error)
      }
    },

    onHttpRequest(req) {
      // Добавляем информацию о токене в заголовки
      const token = ctx.auth.getToken()
      if (token) {
        return {
          ...req,
          headers: {
            ...req.headers,
            Authorization: `Bearer ${token}`,
          },
        }
      }
      return req
    },
  },
}
```

### 7. Плагин для фильтрации запросов

```typescript
import type { Plugin } from 'marzban-sdk'

export const requestFilterPlugin: Plugin = {
  name: 'request-filter',
  version: '1.0.0',
  priority: 200,

  hooks: {
    onHttpRequest(req) {
      // Блокируем запросы к определенным URL
      const blockedUrls = ['/admin/delete', '/system/restart']
      if (blockedUrls.some(url => req.url?.includes(url))) {
        ctx.logger.warn(`Заблокирован запрос к: ${req.url}`)
        throw new Error(`Access denied to ${req.url}`)
      }

      // Проверяем размер данных
      if (req.data && typeof req.data === 'string' && req.data.length > 1000000) {
        ctx.logger.warn(`Слишком большой запрос: ${req.url}`)
        throw new Error('Request too large')
      }

      return req
    },
  },
}
```

## Плагины для производительности

### 8. Плагин для сжатия данных

```typescript
import type { Plugin } from 'marzban-sdk'

export const compressionPlugin: Plugin = {
  name: 'compression',
  version: '1.0.0',
  priority: 25,

  hooks: {
    onHttpRequest(req) {
      // Добавляем заголовок сжатия для больших запросов
      if (req.data && typeof req.data === 'string' && req.data.length > 1024) {
        return {
          ...req,
          headers: {
            ...req.headers,
            'Content-Encoding': 'gzip',
          },
        }
      }
      return req
    },

    onHttpResponse(res, req) {
      // Обрабатываем сжатые ответы
      if (res.headers?.['content-encoding'] === 'gzip') {
        ctx.logger.debug(`Получен сжатый ответ: ${req.url}`)
      }
      return res
    },
  },
}
```

### 9. Плагин для retry логики

```typescript
import type { Plugin } from 'marzban-sdk'

export const retryPlugin: Plugin = {
  name: 'retry',
  version: '1.0.0',
  priority: 15,

  hooks: {
    onHttpError(error, req) {
      const retryCount = (req.meta?.retryCount as number) || 0
      const maxRetries = 3

      if (retryCount < maxRetries && this.isRetryableError(error)) {
        ctx.logger.info(`Retry ${retryCount + 1}/${maxRetries} для ${req.url}`)

        // Здесь можно реализовать логику повторного запроса
        setTimeout(
          () => {
            // Повторный запрос
          },
          Math.pow(2, retryCount) * 1000
        ) // Экспоненциальная задержка
      }
    },
  },

  isRetryableError(error: unknown): boolean {
    // Определяем, какие ошибки можно повторить
    if (error instanceof Error) {
      return ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].some(code => error.message.includes(code))
    }
    return false
  },
}
```

## Плагины для интеграции

### 10. Плагин для отправки уведомлений

```typescript
import type { Plugin } from 'marzban-sdk'

export const notificationPlugin: Plugin = {
  name: 'notifications',
  version: '1.0.0',
  priority: 60,

  hooks: {
    onHttpError(error, req) {
      // Отправляем уведомление о критических ошибках
      if (this.isCriticalError(error)) {
        this.sendNotification({
          type: 'error',
          message: `Critical error: ${req.url}`,
          error: error,
        })
      }
    },

    onAuthFailure(error) {
      this.sendNotification({
        type: 'auth_failure',
        message: 'Authentication failed',
        error: error,
      })
    },
  },

  isCriticalError(error: unknown): boolean {
    // Определяем критические ошибки
    return (
      error instanceof Error && ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].some(code => error.message.includes(code))
    )
  },

  async sendNotification(data: { type: string; message: string; error?: unknown }) {
    // Реализация отправки уведомлений
    // Например, через Slack, email, или другой сервис
    console.log('Notification:', data)
  },
}
```

### 11. Плагин для интеграции с внешними системами

```typescript
import type { Plugin } from 'marzban-sdk'

export const externalIntegrationPlugin: Plugin = {
  name: 'external-integration',
  version: '1.0.0',
  priority: 70,

  hooks: {
    onInit(ctx) {
      // Инициализация подключения к внешней системе
      ctx.storage.set('external-system', {
        connected: false,
        lastSync: null,
      })
    },

    onHttpRequest(req) {
      // Синхронизируем данные с внешней системой
      this.syncWithExternalSystem(req)
      return req
    },

    onHttpResponse(res, req) {
      // Обновляем данные во внешней системе
      this.updateExternalSystem(res, req)
      return res
    },
  },

  async syncWithExternalSystem(req: any) {
    // Логика синхронизации
  },

  async updateExternalSystem(res: any, req: any) {
    // Логика обновления
  },
}
```

## Композитные плагины

### 12. Плагин для разработки

```typescript
import type { Plugin } from 'marzban-sdk'

export const developmentPlugin: Plugin = {
  name: 'development',
  version: '1.0.0',
  priority: 1,

  hooks: {
    onInit(ctx) {
      ctx.logger.info('Development Plugin загружен')

      // Включаем подробное логирование
      ctx.storage.set('dev-mode', true)
    },

    onHttpRequest(req) {
      if (ctx.storage.get('dev-mode')) {
        ctx.logger.debug('Request details:', {
          url: req.url,
          method: req.method,
          headers: req.headers,
          data: req.data,
        })
      }
      return req
    },

    onHttpResponse(res, req) {
      if (ctx.storage.get('dev-mode')) {
        ctx.logger.debug('Response details:', {
          status: res.status,
          headers: res.headers,
          data: res.data,
        })
      }
      return res
    },

    onError(error, meta) {
      ctx.logger.error('Plugin error:', { error, meta })
    },
  },
}
```

## Использование плагинов

### Настройка в конфигурации

```typescript
import { MarzbanSDK } from 'marzban-sdk'
import {
  requestLoggerPlugin,
  cachePlugin,
  metricsPlugin,
  wsMonitorPlugin,
  tokenValidatorPlugin,
  developmentPlugin,
} from './plugins'

const sdk = new MarzbanSDK({
  baseUrl: 'https://your-marzban-instance.com',
  username: 'admin',
  password: 'password',
  plugins: [
    developmentPlugin, // Приоритет 1 - загружается первым
    requestLoggerPlugin, // Приоритет 10
    cachePlugin, // Приоритет 30
    metricsPlugin, // Приоритет 40
    wsMonitorPlugin, // Приоритет 50
    tokenValidatorPlugin, // Приоритет 100
  ],
  logger: {
    level: 'debug', // Включаем отладочное логирование
  },
})
```

### Создание собственного плагина

```typescript
import type { Plugin } from 'marzban-sdk'

export const myCustomPlugin: Plugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  priority: 150,

  enable(ctx) {
    ctx.logger.info('Мой кастомный плагин активирован')
  },

  hooks: {
    onInit(ctx) {
      // Инициализация
      ctx.storage.set('custom-data', { initialized: true })
    },

    onReady(ctx) {
      // Плагин готов к работе
      ctx.logger.info('Мой плагин готов к работе')
    },

    onHttpRequest(req) {
      // Кастомная логика обработки запросов
      return req
    },

    onHttpResponse(res, req) {
      // Кастомная логика обработки ответов
      return res
    },
  },

  disable(ctx) {
    ctx.logger.info('Мой кастомный плагин деактивирован')
  },
}
```

Эти примеры демонстрируют различные способы использования системы плагинов Marzban SDK. Вы можете использовать их как основу для создания собственных плагинов или комбинировать их для решения конкретных задач.
