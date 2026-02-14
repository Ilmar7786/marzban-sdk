import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import axiosRetry from 'axios-retry'

import { Config } from '@/config'
import { AuthManager } from '@/core/auth'
import { Logger } from '@/core/logger'

import { setupAuthInterceptors } from './interceptors'

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

/** Client function type used by generated API (kubb) - accepts RequestConfig and returns ResponseConfig */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ClientFn = <TData, _TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>
) => Promise<ResponseConfig<TData>>

let axiosInstance: AxiosInstance | null = null
let publicInstance: AxiosInstance | null = null

function createClientFromAxios(instance: AxiosInstance): ClientFn {
  return async <TData, TError = unknown, TVariables = unknown>(
    requestConfig: RequestConfig<TVariables>
  ): Promise<ResponseConfig<TData>> => {
    const promise = instance
      .request<TVariables, ResponseConfig<TData>>(requestConfig)
      .catch((e: AxiosError<TError>) => {
        throw e
      })
    return promise
  }
}

export type HttpClientInstance = {
  client: ClientFn
  getPublicInstance: () => AxiosInstance
  /** Client for unauthenticated requests (e.g. login). Use this in AuthManager. */
  publicClient: ClientFn
}

/**
 * Configures HTTP client for a given base URL and auth, and returns an instance-bound client.
 * Also updates the global client/getPublicInstance for backward compatibility (last-created instance).
 * Store and use the returned instance when creating multiple MarzbanSDK instances.
 */
export const configureHttpClient = (
  baseUrl: string,
  authService: AuthManager,
  config: Config,
  logger: Logger
): HttpClientInstance => {
  logger.info(`Configuring HTTP client with base URL: ${baseUrl}`, 'HttpClient')
  logger.debug(`HTTP client configuration: timeout=${config.timeout}s, retries=${config.retries}`, 'HttpClient')

  const instanceAxios = axios.create({ baseURL: baseUrl })
  const instancePublic = axios.create({ baseURL: baseUrl })

  // Update globals for backward compatibility (single-SDK usage, default export)
  axiosInstance = instanceAxios
  publicInstance = instancePublic

  logger.debug('Setting up authentication interceptors', 'HttpClient')
  setupAuthInterceptors(instanceAxios, authService, config, logger)

  logger.debug(`Configuring retry logic: ${config?.retries ?? 3} retries with exponential backoff`, 'HttpClient')
  axiosRetry(instanceAxios, {
    retries: config?.retries ?? 3,
    retryDelay: retryCount => {
      const delay = retryCount * 1000
      logger.debug(`Retry attempt ${retryCount}, delay: ${delay}ms`, 'HttpClient')
      return delay
    },
  })

  axiosRetry(instancePublic, {
    retries: config?.retries ?? 3,
    retryDelay: retryCount => {
      const delay = retryCount * 1000
      logger.debug(`Public instance retry attempt ${retryCount}, delay: ${delay}ms`, 'HttpClient')
      return delay
    },
  })

  logger.info('HTTP client configuration completed successfully', 'HttpClient')

  return {
    client: createClientFromAxios(instanceAxios),
    getPublicInstance: () => instancePublic,
    publicClient: createClientFromAxios(instancePublic),
  }
}

export const client = async <TData, TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>
): Promise<ResponseConfig<TData>> => {
  if (!axiosInstance) {
    throw new Error('Axios instance is not configured. Please call configureHttpClient first.')
  }

  const promise = axiosInstance.request<TVariables, ResponseConfig<TData>>(config).catch((e: AxiosError<TError>) => {
    throw e
  })

  return promise
}

export const getPublicInstance = (): AxiosInstance => {
  if (!publicInstance) {
    throw new Error('Axios instance is not configured. Please call configureHttpClient first.')
  }

  return publicInstance
}

/** ClientFn for unauthenticated requests (uses global public instance). For per-instance use, pass publicClient from configureHttpClient. */
export const getPublicClient = (): ClientFn => createClientFromAxios(getPublicInstance())

export default client
