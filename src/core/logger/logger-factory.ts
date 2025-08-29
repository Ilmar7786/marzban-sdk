import { SdkError } from '../errors'
import { ERROR_CODES } from '../errors/codes'
import { DefaultLogger } from './default-logger'
import { Logger, LoggerConfig } from './logger.types'
import { isLogger, isLoggerOptions } from './logger.utils'

export const createLogger = (loggerConfig?: LoggerConfig): Logger => {
  if (loggerConfig === false) {
    return {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    }
  } else if (isLogger(loggerConfig)) {
    // Custom logger
    return loggerConfig
  } else if (isLoggerOptions(loggerConfig) || loggerConfig === undefined) {
    // Standard logger with settings
    return new DefaultLogger(loggerConfig)
  } else {
    throw new SdkError(ERROR_CODES.LOGGER_INVALID)
  }
}
