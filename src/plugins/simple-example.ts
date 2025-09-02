import type { Plugin } from '../core/plugin/plugin.types'

/**
 * A simple plug-in example to demonstrate the new architecture
 *
 * This plugin shows:
 * 1. How to register HTTP handlers via enable(ctx)
 * 2. How to use lifecycle via hooks (with ctx!)
 * 3. Simplicity and clarity of the new system
 * 4. Full access to the SDK API in hooks
 */
export const simpleExamplePlugin: Plugin = {
  name: 'simple-example',
  priority: 100,

  // enable(ctx) - main method for registering handlers
  enable(ctx) {
    ctx.logger.info('Simple Example Plugin activated')

    // Register HTTP handlers
    ctx.http.useRequest(req => {
      ctx.logger.debug(`HTTP Request: ${req.method} ${req.url}`)
      return req
    })

    ctx.http.useResponse((res, req) => {
      ctx.logger.debug(`HTTP Response: ${res.status} for ${req.method} ${req.url}`)
      return res
    })

    // Register WebSocket handlers
    ctx.ws.useConnect(info => {
      ctx.logger.info(`WebSocket connected: ${info.url}`)
    })

    // Register Auth handlers
    ctx.auth.on('start', () => {
      ctx.logger.info('Authentication started')
    })

    ctx.auth.on('success', () => {
      ctx.logger.info('Authentication successful')
    })

    // Save data in plugin storage
    ctx.storage.set('activated', true)
    ctx.storage.set('activatedAt', new Date().toISOString())
  },

  // hooks - now with ctx for full access to SDK API!
  hooks: {
    onInit(ctx) {
      // ✅ Now we have access to logger, storage, config!
      ctx.logger.info('Simple Example Plugin initialized')

      // Save initialization time
      ctx.storage.set('initTime', Date.now())

      // Log configuration
      ctx.logger.debug(`Plugin config: baseUrl=${ctx.config.baseUrl}, timeout=${ctx.config.timeout}`)

      // Check settings
      if (ctx.config.timeout && ctx.config.timeout > 30) {
        ctx.logger.warn('High timeout may slow down the plugin')
      }
    },

    onReady(ctx) {
      // ✅ Full access to API in onReady!
      ctx.logger.info('Simple Example Plugin is ready')

      // Save ready time
      ctx.storage.set('readyTime', Date.now())

      // You can even register additional handlers!
      ctx.http.useRequest(req => {
        ctx.logger.debug('Additional handler from onReady')
        return req
      })

      // Log statistics
      const initTime = ctx.storage.get<number>('initTime')
      const readyTime = ctx.storage.get<number>('readyTime')
      if (initTime && readyTime) {
        const initDuration = readyTime - initTime
        ctx.logger.info(`Initialization time: ${initDuration}ms`)
      }
    },
  },

  // disable(ctx) - for cleanup on disable
  disable(ctx) {
    ctx.logger.info('Simple Example Plugin disabled')

    // Log statistics before cleanup
    const activatedAt = ctx.storage.get<string>('activatedAt')
    if (activatedAt) {
      const uptime = Date.now() - new Date(activatedAt).getTime()
      ctx.logger.info(`Plugin uptime: ${Math.round(uptime / 1000)}s`)
    }

    ctx.storage.clear()
  },
}
