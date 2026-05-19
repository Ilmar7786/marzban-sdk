export interface Logger {
  debug(message: string, context?: string): void
  info(message: string, context?: string): void
  warn(message: string, context?: string): void
  error(message: string, trace?: unknown, context?: string): void
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerOptions {
  level?: LogLevel
  timestamp?: boolean
}

export type LoggerConfig = false | LoggerOptions | Logger
