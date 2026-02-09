import { AxiosInstance } from 'axios'

import { AuthManager } from '@/core/auth'
import { HttpError, SdkError } from '@/core/errors'
import { Logger } from '@/core/logger'

/**
 * Sets up interceptors for the Axios client.
 *
 * @param client - The Axios instance to set up interceptors for.
 * @param authService - The authentication service instance.
 * @param config - The configuration object containing authentication details.
 * @param config.username - The username for authentication.
 * @param config.password - The password for authentication.
 * @param logger - The logger instance for logging interceptor events.
 */
export const setupAuthInterceptors = (
  client: AxiosInstance,
  authService: AuthManager,
  config: { username: string; password: string },
  logger: Logger
) => {
  logger.debug('Setting up authentication request interceptor', 'AuthInterceptor')
  client.interceptors.request.use(
    async requestConfig => {
      await authService.waitForCurrentAuth()
      const accessToken = authService.accessToken
      if (accessToken) {
        requestConfig.headers.authorization = `Bearer ${accessToken}`
        logger.debug('Authorization header added to request', 'AuthInterceptor')
      } else {
        logger.warn('No access token available for request', 'AuthInterceptor')
      }
      return requestConfig
    },
    error => {
      logger.error('Request interceptor error', error, 'AuthInterceptor')
      if (error instanceof SdkError) return Promise.reject(error)
      return Promise.reject(new HttpError(error))
    }
  )

  logger.debug('Setting up authentication response interceptor', 'AuthInterceptor')
  client.interceptors.response.use(
    response => {
      return response
    },
    async error => {
      const retryConfig = error?.config

      if (error?.response?.status === 401 && !retryConfig?.sent) {
        logger.warn('Received 401 Unauthorized, attempting to re-authenticate', 'AuthInterceptor')
        retryConfig.sent = true
        try {
          await authService.authenticate(config.username, config.password)
          const accessToken = authService.accessToken
          if (accessToken) {
            retryConfig.headers.authorization = `Bearer ${accessToken}`
            logger.info('Re-authentication successful, retrying request', 'AuthInterceptor')
            return client(retryConfig)
          } else {
            logger.error('Re-authentication failed: No access token received', null, 'AuthInterceptor')
          }
        } catch (err) {
          logger.error('Re-authentication failed', err, 'AuthInterceptor')
          if (err instanceof SdkError) return Promise.reject(err)
          return Promise.reject(new HttpError(err))
        }
      }
      if (error instanceof SdkError) return Promise.reject(error)
      return Promise.reject(new HttpError(error))
    }
  )
}
