import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import axiosRetry from 'axios-retry'

import { Config } from '../../config'
import { AuthManager } from '../auth'
import { Logger } from '../logger'
import type { PluginRegistry } from '../plugin/plugin.registry'
import { setupAuthInterceptors, setupLoggingInterceptors, setupPluginInterceptors } from './interceptors'

/**
 * Subset of AxiosRequestConfig
 */
export type RequestConfig<TData = unknown> = {
  baseURL?: string
  url?: string
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'
  params?: unknown
  data?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: AxiosRequestConfig['headers']
}
/**
 * Subset of AxiosResponse
 */
export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers?: AxiosResponse['headers']
}

export type ResponseErrorConfig<TError = unknown> = TError

let axiosInstance: AxiosInstance | null = null
let publicInstance: AxiosInstance | null = null

export const configureHttpClient = (
  baseUrl: string,
  authService: AuthManager,
  config: Config,
  logger: Logger,
  plugins?: PluginRegistry
): AxiosInstance => {
  logger.info(`Configuring HTTP client with base URL: ${baseUrl}`, 'HttpClient')
  logger.debug(`HTTP client configuration: timeout=${config.timeout}s, retries=${config.retries}`, 'HttpClient')

  axiosInstance = axios.create({ baseURL: baseUrl })
  publicInstance = axios.create({ baseURL: baseUrl })

  logger.debug('Setting up authentication interceptors', 'HttpClient')
  setupAuthInterceptors(axiosInstance, authService, config, logger)

  logger.debug('Setting up logging interceptors', 'HttpClient')
  setupLoggingInterceptors(axiosInstance, logger)

  // Plugin-driven request/response hooks
  if (plugins) {
    logger.debug('Setting up plugin interceptors', 'HttpClient')
    setupPluginInterceptors(axiosInstance, plugins)
  }

  logger.debug(`Configuring retry logic: ${config?.retries ?? 3} retries with exponential backoff`, 'HttpClient')
  axiosRetry(axiosInstance, {
    retries: config?.retries ?? 3,
    retryDelay: retryCount => {
      const delay = retryCount * 1000
      logger.debug(`Retry attempt ${retryCount}, delay: ${delay}ms`, 'HttpClient')
      return delay
    },
  })

  axiosRetry(publicInstance, {
    retries: config?.retries ?? 3,
    retryDelay: retryCount => {
      const delay = retryCount * 1000
      logger.debug(`Public instance retry attempt ${retryCount}, delay: ${delay}ms`, 'HttpClient')
      return delay
    },
  })

  logger.info('HTTP client configuration completed successfully', 'HttpClient')
  return axiosInstance
}

export const client = async <TData, TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> => {
  if (!axiosInstance) {
    throw new Error('Axios instance is not configured. Please call configureAxiosInstance first.')
  }

  const promise = axiosInstance.request<TVariables, ResponseConfig<TData>>(config).catch((e: AxiosError<TError>) => {
    throw e
  })

  return promise
}

export const getPublicInstance = () => {
  if (!publicInstance) {
    throw new Error('Axios instance is not configured. Please call configureAxiosInstance first.')
  }

  return publicInstance
}

export default client
