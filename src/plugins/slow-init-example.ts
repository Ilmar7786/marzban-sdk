import type { Plugin } from '../core/plugin/plugin.types'

/**
 * Example plugin with slow initialization
 *
 * Demonstrates:
 * 1. Slow initialization (simulation of data loading)
 * 2. How the user can control the process
 * 3. New asynchronous initialization capabilities
 */
export const slowInitPlugin: Plugin = {
  name: 'slow-init-example',
  priority: 50,

  // enable(ctx) - slow initialization
  async enable(ctx) {
    ctx.logger.info('Slow Init Plugin: starting slow initialization...')

    // Simulate a slow operation (e.g., loading data from API)
    await new Promise(resolve => setTimeout(resolve, 5000)) // 5 seconds

    // Register HTTP handlers
    ctx.http.useRequest(req => {
      ctx.logger.debug(`Slow Plugin: processing request ${req.method} ${req.url}`)
      // Add header from plugin
      req.headers = { ...req.headers, 'X-Slow-Plugin': 'initialized' }
      return req
    })

    ctx.http.useResponse((res, req) => {
      ctx.logger.debug(`Slow Plugin: processing response ${res.status} for ${req.method} ${req.url}`)
      return res
    })

    ctx.logger.info('Slow Init Plugin: initialization completed!')
  },

  // hooks - lifecycle
  hooks: {
    async onInit(ctx) {
      ctx.logger.info('Slow Init Plugin: onInit - starting setup...')

      // Simulate another slow operation
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 seconds

      // Save initialization time
      ctx.storage.set('initTime', Date.now())
      ctx.storage.set('config', ctx.config)

      ctx.logger.info('Slow Init Plugin: onInit completed')
    },

    async onReady(ctx) {
      ctx.logger.info('Slow Init Plugin: onReady - final preparation...')

      // Simulate final setup
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second

      ctx.storage.set('readyTime', Date.now())

      // Log statistics
      const initTime = ctx.storage.get<number>('initTime')
      const readyTime = ctx.storage.get<number>('readyTime')
      if (initTime && readyTime) {
        const totalTime = readyTime - initTime
        ctx.logger.info(`Slow Init Plugin: total initialization time: ${totalTime}ms`)
      }

      ctx.logger.info('Slow Init Plugin: ready to work!')
    },
  },

  // disable(ctx) - cleanup
  async disable(ctx) {
    ctx.logger.info('Slow Init Plugin: disabling...')

    // Log work statistics
    const initTime = ctx.storage.get<number>('initTime')
    const readyTime = ctx.storage.get<number>('readyTime')
    if (initTime && readyTime) {
      const uptime = Date.now() - readyTime
      ctx.logger.info(`Slow Init Plugin: uptime: ${Math.round(uptime / 1000)}s`)
    }

    ctx.storage.clear()
  },
}
