import { AxiosInstance, AxiosResponse } from 'axios'

import { Logger } from '../../logger'

/**
 * Sets up interceptors for logging HTTP requests and responses.
 *
 * @param client - Axios Instance
 * @param logger - A logger that implements the Logger interface
 */
export function setupLoggingInterceptors(client: AxiosInstance, logger: Logger) {
  // Logging requests
  client.interceptors.request.use(
    config => {
      const method = config.method?.toUpperCase()
      const url = config.url
      logger.debug(`HTTP Request: ${method} ${url}`, 'HTTP')

      if (config.params) {
        logger.debug(`Request params: ${JSON.stringify(config.params)}`, 'HTTP')
      }

      if (config.data) {
        // Don't log sensitive data like passwords
        const sanitizedData = sanitizeLogData(config.data)
        logger.debug(`Request payload: ${JSON.stringify(sanitizedData)}`, 'HTTP')
      }

      return config
    },
    error => {
      logger.error('HTTP Request interceptor error', error, 'HTTP')
      return Promise.reject(error)
    }
  )

  // Logging responses
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const method = response.config.method?.toUpperCase()
      const url = response.config.url
      const status = response.status

      logger.info(`HTTP Response: ${status} ${method} ${url}`, 'HTTP')

      if (response.data && typeof response.data === 'object') {
        logger.debug(`Response payload: ${JSON.stringify(response.data)}`, 'HTTP')
      }

      return response
    },
    error => {
      const method = error.config?.method?.toUpperCase()
      const url = error.config?.url
      const status = error.response?.status

      if (error.response) {
        logger.warn(`HTTP Error Response: ${status} ${method} ${url}`, 'HTTP')
        if (error.response.data) {
          logger.debug(`Error response payload: ${JSON.stringify(error.response.data)}`, 'HTTP')
        }
      } else if (error.request) {
        logger.error(`HTTP Request failed (no response): ${method} ${url}`, error, 'HTTP')
      } else {
        logger.error('HTTP Request setup error', error, 'HTTP')
      }

      return Promise.reject(error)
    }
  )
}

/**
 * Sanitizes sensitive data from logs
 */
function sanitizeLogData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization']
  const sanitized = { ...(data as Record<string, unknown>) }

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}
