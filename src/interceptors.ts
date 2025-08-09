import { AxiosInstance } from 'axios'

import { AuthService } from './AuthService'
import { Logger } from './logger'

/**
 * Sets up interceptors for the Axios client.
 *
 * @param client - The Axios instance to set up interceptors for.
 * @param authService - The authentication service instance.
 * @param config - The configuration object containing authentication details.
 * @param config.username - The username for authentication.
 * @param config.password - The password for authentication.
 * @param logger - Optional logger instance for logging interceptor events.
 */
export const setupInterceptors = (
  client: AxiosInstance,
  authService: AuthService,
  config: { username: string; password: string },
  logger: Logger
) => {
  client.interceptors.request.use(
    async requestConfig => {
      await authService.waitForAuth()
      const accessToken = authService.getAccessToken()
      logger.debug(
        `Injecting access token into request headers: ${accessToken ? 'Present' : 'Missing'}`,
        'AxiosInterceptor'
      )

      requestConfig.headers.authorization = accessToken ? `Bearer ${accessToken}` : undefined
      return requestConfig
    },
    error => {
      logger.error('Request interceptor error', error, 'AxiosInterceptor')
      return Promise.reject(error)
    }
  )

  client.interceptors.response.use(
    response => response,
    async error => {
      const retryConfig = error?.config
      if (error?.response?.status === 401 && !retryConfig?.sent) {
        retryConfig.sent = true
        logger.warn('401 Unauthorized detected. Attempting to re-authenticate...', 'AxiosInterceptor')
        try {
          await authService.authenticate({ username: config.username, password: config.password })
          const accessToken = authService.getAccessToken()
          if (accessToken) {
            logger.info('Re-authentication successful, retrying original request.', 'AxiosInterceptor')
            retryConfig.headers.authorization = `Bearer ${accessToken}`
            return client(retryConfig)
          }
        } catch (err) {
          logger.error('Re-authentication failed.', err, 'AxiosInterceptor')
          return Promise.reject(err)
        }
      }

      logger.error('Response interceptor error', error, 'AxiosInterceptor')
      return Promise.reject(error)
    }
  )
}
