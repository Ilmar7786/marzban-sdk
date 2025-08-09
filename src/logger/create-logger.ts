import { DefaultLogger } from './default-logger'
import { Logger, LoggerConfig, LoggerOptions } from './logger.types'

function isLogger(obj: unknown): obj is Logger {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ['debug', 'info', 'warn', 'error'].every(method => typeof (obj as any)[method] === 'function')
  )
}

function isLoggerOptions(obj: unknown): obj is LoggerOptions {
  if (typeof obj !== 'object' || obj === null) return false
  const allowedKeys: (keyof LoggerOptions)[] = ['level', 'timestamp']
  return Object.keys(obj).every(k => allowedKeys.includes(k as keyof LoggerOptions))
}

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
    throw new Error('Invalid logger option: must be false, LoggerOptions, or Logger instance')
  }
}
