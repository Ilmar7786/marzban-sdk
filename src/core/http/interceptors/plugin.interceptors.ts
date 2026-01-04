import type { AxiosInstance, AxiosRequestConfig, AxiosRequestHeaders } from 'axios'

import type { HttpRequest, HttpResponse, PluginRegistry } from '@/core/plugin'

export const setupPluginInterceptors = (client: AxiosInstance, plugins: PluginRegistry): void => {
  client.interceptors.request.use(async requestConfig => {
    const req: HttpRequest = {
      url: requestConfig.url,
      method: (requestConfig.method || 'get').toUpperCase(),
      headers: (requestConfig.headers as Record<string, string>) || undefined,
      data: requestConfig.data,
      meta: {},
    }
    const next = await plugins.runHttpRequest(req)
    requestConfig.url = next.url ?? requestConfig.url
    requestConfig.method = (next.method || requestConfig.method) as AxiosRequestConfig['method']
    if (next.headers) {
      const headers: AxiosRequestHeaders = (requestConfig.headers as AxiosRequestHeaders) || ({} as AxiosRequestHeaders)
      Object.assign(headers as unknown as Record<string, string>, next.headers as Record<string, string>)
      requestConfig.headers = headers
    }
    requestConfig.data = typeof next.data === 'undefined' ? requestConfig.data : next.data
    return requestConfig
  })

  client.interceptors.response.use(
    async response => {
      const res: HttpResponse = {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
      }
      const req: HttpRequest = {
        url: response.config.url,
        method: (response.config.method || 'get').toUpperCase(),
        headers: (response.config.headers as Record<string, string>) || undefined,
        data: response.config.data,
      }
      const next = await plugins.runHttpResponse(res, req)
      response.data = next.data as unknown as never
      return response
    },
    async error => {
      try {
        const cfg = error?.config || {}
        const req: HttpRequest = {
          url: cfg.url,
          method: (cfg.method || 'get').toUpperCase(),
          headers: (cfg.headers as Record<string, string>) || undefined,
          data: cfg.data,
        }
        await plugins.runHttpError(error, req)
      } catch {
        // noop
      }
      return Promise.reject(error)
    }
  )
}
