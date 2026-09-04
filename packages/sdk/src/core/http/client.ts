import { Client } from '@kubb/plugin-client/clients/axios'
import axios, { AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'

import { isBrowser } from '@/common'
import { MAX_RETRY_DELAY_MS, RETRY_BASE_DELAY_MS, ValidatedConfig } from '@/config'

import { AuthManager } from '../auth'
import { computeBackoff } from '../backoff'
import { Logger } from '../logger'
import { setupAuthInterceptors } from './interceptors'
import { createRetryCondition, LOGIN_RETRYABLE_METHODS, SAFE_HTTP_METHODS } from './retry'

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

  const retries = config.retries
  // Exponential backoff capped at MAX_RETRY_DELAY_MS: 1s, 2s, 4s, 8s, ...
  // No jitter here — deterministic delay is the existing, tested behavior;
  // jitter is opt-in for the WS reconnect state machine (core/ws) instead.
  const retryDelay = (retryCount: number): number => {
    const delay = computeBackoff(retryCount, { baseMs: RETRY_BASE_DELAY_MS, maxMs: MAX_RETRY_DELAY_MS })
    logger.debug(`Retry attempt ${retryCount}, delay: ${delay}ms`, 'HttpClient')
    return delay
  }

  // Must run before setupAuthInterceptors: axios-retry needs the raw
  // AxiosError (error.config) to decide whether to retry. Auth wraps errors
  // into HttpError, which has no .config — registering it first would make
  // axios-retry silently no-op.
  logger.debug(`Configuring retry logic: ${retries} retries with exponential backoff`, 'HttpClient')
  axiosRetry(instanceAxios, { retries, retryDelay, retryCondition: createRetryCondition(SAFE_HTTP_METHODS) })
  axiosRetry(instancePublic, { retries, retryDelay, retryCondition: createRetryCondition(LOGIN_RETRYABLE_METHODS) })

  logger.debug('Setting up authentication interceptors', 'HttpClient')
  setupAuthInterceptors(instanceAxios, authService, config, logger)

  return {
    client: createClientFromAxios(instanceAxios),
    publicClient: createClientFromAxios(instancePublic),
  }
}
