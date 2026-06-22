import { Client } from '@kubb/plugin-client/clients/axios'
import axios, { AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'

import { MAX_RETRY_DELAY_MS, RETRY_BASE_DELAY_MS, ValidatedConfig } from '@/config'

import { AuthManager } from '../auth'
import { Logger } from '../logger'
import { setupAuthInterceptors } from './interceptors'

function createClientFromAxios(instance: AxiosInstance): Client {
  return requestConfig => instance.request(requestConfig)
}

export type HttpClientInstance = {
  /** Authenticated client used for all API requests. */
  client: Client
  /** Client for unauthenticated requests (e.g. login). Use this in AuthManager. */
  publicClient: Client
}

/**
 * Configures an HTTP client for the given base URL and auth service, and returns
 * an instance-bound pair of clients (authenticated + public).
 *
 * Each call produces independent Axios instances, so multiple MarzbanSDK
 * instances never share state — store and use the returned object per SDK.
 */
export const configureHttpClient = (
  baseUrl: string,
  authService: AuthManager,
  config: ValidatedConfig,
  logger: Logger
): HttpClientInstance => {
  logger.info(`Configuring HTTP client with base URL: ${baseUrl}`, 'HttpClient')
  logger.debug(`HTTP client configuration: timeout=${config.timeout}ms, retries=${config.retries}`, 'HttpClient')

  const instanceAxios = axios.create({ baseURL: baseUrl, timeout: config.timeout })
  const instancePublic = axios.create({ baseURL: baseUrl, timeout: config.timeout })

  logger.debug('Setting up authentication interceptors', 'HttpClient')
  setupAuthInterceptors(instanceAxios, authService, config, logger)

  const retries = config.retries
  // Exponential backoff capped at MAX_RETRY_DELAY_MS: 1s, 2s, 4s, 8s, ...
  const retryDelay = (retryCount: number): number => {
    const delay = Math.min(2 ** (retryCount - 1) * RETRY_BASE_DELAY_MS, MAX_RETRY_DELAY_MS)
    logger.debug(`Retry attempt ${retryCount}, delay: ${delay}ms`, 'HttpClient')
    return delay
  }

  logger.debug(`Configuring retry logic: ${retries} retries with exponential backoff`, 'HttpClient')
  axiosRetry(instanceAxios, { retries, retryDelay })
  axiosRetry(instancePublic, { retries, retryDelay })

  logger.info('HTTP client configuration completed successfully', 'HttpClient')

  return {
    client: createClientFromAxios(instanceAxios),
    publicClient: createClientFromAxios(instancePublic),
  }
}
