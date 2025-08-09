import { AxiosInstance, AxiosResponse } from 'axios'

import { Logger } from './logger.types'

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
      logger.debug(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, 'HTTP')
      if (config.data) {
        logger.debug(`Request payload: ${JSON.stringify(config.data)}`, 'HTTP')
      }
      return config
    },
    error => {
      logger.error('Request error', error, 'HTTP')
      return Promise.reject(error)
    }
  )

  // Logging responses
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      logger.info(
        `HTTP Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        'HTTP'
      )
      if (response.data) {
        logger.debug(`Response payload: ${JSON.stringify(response.data)}`, 'HTTP')
      }
      return response
    },
    error => {
      if (error.response) {
        logger.warn(
          `HTTP Error Response: ${error.response.status} ${error.config.method?.toUpperCase()} ${error.config.url}`,
          'HTTP'
        )
        if (error.response.data) {
          logger.debug(`Error response payload: ${JSON.stringify(error.response.data)}`, 'HTTP')
        }
      } else {
        logger.error('HTTP Request failed without response', error, 'HTTP')
      }
      return Promise.reject(error)
    }
  )
}
