import { AnyType } from '@/common'

import { Logger, LoggerOptions } from './logger.types'

export function isLogger(obj: unknown): obj is Logger {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ['debug', 'info', 'warn', 'error'].every(method => typeof (obj as AnyType)[method] === 'function')
  )
}

export function isLoggerOptions(obj: unknown): obj is LoggerOptions {
  if (typeof obj !== 'object' || obj === null) return false
  const allowedKeys: (keyof LoggerOptions)[] = ['level', 'timestamp']
  return Object.keys(obj).every(k => allowedKeys.includes(k as keyof LoggerOptions))
}
