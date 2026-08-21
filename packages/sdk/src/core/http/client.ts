import { Client } from '@kubb/plugin-client/clients/axios'
import axios, { AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'

import { isBrowser } from '@/common'
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
  const hasCustomAgent = Boolean(config.httpAgent || config.httpsAgent)

  logger.debug(
    `Configuring HTTP client: baseURL=${baseUrl}, timeout=${config.timeout}ms, retries=${config.retries}, customAgent=${hasCustomAgent}`,
    'HttpClient'
  )

  // axios silently ignores httpAgent/httpsAgent in the browser (it has no
  // concept of a Node agent) — warn instead of leaving a configured-but-inert
  // option, which is harder to notice than a log line.
  if (hasCustomAgent && isBrowser()) {
    logger.warn('httpAgent/httpsAgent are ignored in the browser — they only apply to Node.js requests.', 'HttpClient')
  }

  // Built conditionally (rather than always spreading possibly-undefined
  // keys) so a caller without a custom agent gets the exact same axios
  // config as before this option existed.
  const agentOptions = {
    ...(config.httpAgent && { httpAgent: config.httpAgent }),
    ...(config.httpsAgent && { httpsAgent: config.httpsAgent }),
  }
  const instanceAxios = axios.create({ baseURL: baseUrl, timeout: config.timeout, ...agentOptions })
  const instancePublic = axios.create({ baseURL: baseUrl, timeout: config.timeout, ...agentOptions })

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

  return {
    client: createClientFromAxios(instanceAxios),
    publicClient: createClientFromAxios(instancePublic),
  }
}
