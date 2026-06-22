import { AnyType, isDevEnvironment } from '@/common'

import { Logger, LoggerOptions, LogLevel } from './logger.types'

/**
 * Default log level when the caller does not specify one.
 *
 * Development environments get `info` (useful visibility during local work),
 * while production stays at `error` to avoid noisy output. See
 * {@link isDevEnvironment}. An explicit `level` in the logger config always
 * takes precedence over this default.
 */
export function getDefaultLogLevel(): LogLevel {
  return isDevEnvironment() ? 'info' : 'error'
}

export function isLogger(obj: unknown): obj is Logger {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ['debug', 'info', 'warn', 'error'].every(method => typeof (obj as AnyType)[method] === 'function')
  )
}

export function isLoggerOptions(obj: unknown): obj is LoggerOptions {
  if (typeof obj !== 'object' || obj === null) return false
  if (isLogger(obj)) return false
  const allowedKeys: (keyof LoggerOptions)[] = ['level', 'timestamp']
  return Object.keys(obj).every(k => allowedKeys.includes(k as keyof LoggerOptions))
}
