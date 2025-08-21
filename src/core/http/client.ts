import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import axiosRetry from 'axios-retry'

import { Config } from '../../config'
import { AuthManager } from '../auth'
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

let axiosInstance: AxiosInstance | null = null
let publicInstance: AxiosInstance | null = null

export const configureHttpClient = (baseUrl: string, authService: AuthManager, config: Config): AxiosInstance => {
  axiosInstance = axios.create({ baseURL: baseUrl })
  publicInstance = axios.create({ baseURL: baseUrl })

  setupAuthInterceptors(axiosInstance, authService, config)

  axiosRetry(axiosInstance, {
    retries: config?.retries ?? 3,
    retryDelay: retryCount => retryCount * 1000,
  })

  axiosRetry(publicInstance, {
    retries: config?.retries ?? 3,
    retryDelay: retryCount => retryCount * 1000,
  })

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
