import type { Plugin } from '../core/plugin/plugin.types'

/**
 * Простой пример плагина для демонстрации новой архитектуры
 *
 * Этот плагин показывает:
 * 1. Как регистрировать HTTP обработчики через enable(ctx)
 * 2. Как использовать жизненный цикл через hooks (с ctx!)
 * 3. Простоту и понятность новой системы
 * 4. Полный доступ к API SDK в hooks
 */
export const simpleExamplePlugin: Plugin = {
  name: 'simple-example',
  priority: 100,

  // enable(ctx) - основной метод для регистрации обработчиков
  enable(ctx) {
    ctx.logger.info('Simple Example Plugin активирован')

    // Регистрируем HTTP обработчики
    ctx.http.useRequest(req => {
      ctx.logger.debug(`HTTP Request: ${req.method} ${req.url}`)
      return req
    })

    ctx.http.useResponse((res, req) => {
      ctx.logger.debug(`HTTP Response: ${res.status} for ${req.method} ${req.url}`)
      return res
    })

    // Регистрируем WebSocket обработчики
    ctx.ws.useConnect(info => {
      ctx.logger.info(`WebSocket подключен: ${info.url}`)
    })

    // Регистрируем Auth обработчики
    ctx.auth.on('start', () => {
      ctx.logger.info('Начало аутентификации')
    })

    ctx.auth.on('success', () => {
      ctx.logger.info('Аутентификация успешна')
    })

    // Сохраняем данные в storage плагина
    ctx.storage.set('activated', true)
    ctx.storage.set('activatedAt', new Date().toISOString())
  },

  // hooks - теперь с ctx для полного доступа к API SDK!
  hooks: {
    onInit(ctx) {
      // ✅ Теперь у нас есть доступ к logger, storage, config!
      ctx.logger.info('Simple Example Plugin инициализирован')

      // Сохраняем время инициализации
      ctx.storage.set('initTime', Date.now())

      // Логируем конфигурацию
      ctx.logger.debug(`Plugin config: baseUrl=${ctx.config.baseUrl}, timeout=${ctx.config.timeout}`)

      // Проверяем настройки
      if (ctx.config.timeout && ctx.config.timeout > 30) {
        ctx.logger.warn('Большой timeout может замедлить работу плагина')
      }
    },

    onReady(ctx) {
      // ✅ Полный доступ к API в onReady!
      ctx.logger.info('Simple Example Plugin готов к работе')

      // Сохраняем время готовности
      ctx.storage.set('readyTime', Date.now())

      // Можно даже зарегистрировать дополнительные обработчики!
      ctx.http.useRequest(req => {
        ctx.logger.debug('Дополнительный обработчик из onReady')
        return req
      })

      // Логируем статистику
      const initTime = ctx.storage.get<number>('initTime')
      const readyTime = ctx.storage.get<number>('readyTime')
      if (initTime && readyTime) {
        const initDuration = readyTime - initTime
        ctx.logger.info(`Время инициализации: ${initDuration}ms`)
      }
    },
  },

  // disable(ctx) - для очистки при отключении
  disable(ctx) {
    ctx.logger.info('Simple Example Plugin отключен')

    // Логируем статистику перед очисткой
    const activatedAt = ctx.storage.get<string>('activatedAt')
    if (activatedAt) {
      const uptime = Date.now() - new Date(activatedAt).getTime()
      ctx.logger.info(`Время работы плагина: ${Math.round(uptime / 1000)}s`)
    }

    ctx.storage.clear()
  },
}
