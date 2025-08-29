import type { Plugin } from '../core/plugin/plugin.types'

/**
 * Пример плагина с медленной инициализацией
 *
 * Демонстрирует:
 * 1. Медленную инициализацию (имитация загрузки данных)
 * 2. Как пользователь может управлять процессом
 * 3. Новые возможности асинхронной инициализации
 */
export const slowInitPlugin: Plugin = {
  name: 'slow-init-example',
  priority: 50,

  // enable(ctx) - медленная инициализация
  async enable(ctx) {
    ctx.logger.info('Slow Init Plugin: начинаю медленную инициализацию...')

    // Имитируем медленную операцию (например, загрузка данных из API)
    await new Promise(resolve => setTimeout(resolve, 5000)) // 5 секунд

    // Регистрируем HTTP обработчики
    ctx.http.useRequest(req => {
      ctx.logger.debug(`Slow Plugin: обрабатываю запрос ${req.method} ${req.url}`)
      // Добавляем заголовок от плагина
      req.headers = { ...req.headers, 'X-Slow-Plugin': 'initialized' }
      return req
    })

    ctx.http.useResponse((res, req) => {
      ctx.logger.debug(`Slow Plugin: обрабатываю ответ ${res.status} для ${req.method} ${req.url}`)
      return res
    })

    ctx.logger.info('Slow Init Plugin: инициализация завершена!')
  },

  // hooks - жизненный цикл
  hooks: {
    async onInit(ctx) {
      ctx.logger.info('Slow Init Plugin: onInit - начинаю настройку...')

      // Имитируем еще одну медленную операцию
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 секунды

      // Сохраняем время инициализации
      ctx.storage.set('initTime', Date.now())
      ctx.storage.set('config', ctx.config)

      ctx.logger.info('Slow Init Plugin: onInit завершен')
    },

    async onReady(ctx) {
      ctx.logger.info('Slow Init Plugin: onReady - финальная подготовка...')

      // Имитируем финальную настройку
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 секунда

      ctx.storage.set('readyTime', Date.now())

      // Логируем статистику
      const initTime = ctx.storage.get<number>('initTime')
      const readyTime = ctx.storage.get<number>('readyTime')
      if (initTime && readyTime) {
        const totalTime = readyTime - initTime
        ctx.logger.info(`Slow Init Plugin: общее время инициализации: ${totalTime}ms`)
      }

      ctx.logger.info('Slow Init Plugin: готов к работе!')
    },
  },

  // disable(ctx) - очистка
  async disable(ctx) {
    ctx.logger.info('Slow Init Plugin: отключение...')

    // Логируем статистику работы
    const initTime = ctx.storage.get<number>('initTime')
    const readyTime = ctx.storage.get<number>('readyTime')
    if (initTime && readyTime) {
      const uptime = Date.now() - readyTime
      ctx.logger.info(`Slow Init Plugin: время работы: ${Math.round(uptime / 1000)}s`)
    }

    ctx.storage.clear()
  },
}
