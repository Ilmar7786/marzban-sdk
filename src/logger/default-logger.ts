import { Logger, LoggerOptions, LogLevel } from './logger.types'

export class DefaultLogger implements Logger {
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  private currentLevel: LogLevel
  private timestamp: boolean

  constructor(options?: LoggerOptions) {
    this.currentLevel = options?.level ?? 'info'
    this.timestamp = options?.timestamp ?? true
  }

  private shouldLog(level: LogLevel) {
    return this.levelPriority[level] >= this.levelPriority[this.currentLevel]
  }

  private format(level: string, message: string, context?: string) {
    const ts = this.timestamp ? `${new Date().toISOString()}` : ''
    const ctx = context ? `[${context}]` : ''
    const paddedLevel = level.toUpperCase().padStart(5, ' ')

    return `[MarzbanSDK] ${ts} ${paddedLevel} ${ctx} ${message}`
  }

  debug(message: string, context?: string) {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', message, context))
    }
  }

  info(message: string, context?: string) {
    if (this.shouldLog('info')) {
      console.info(this.format('info', message, context))
    }
  }

  warn(message: string, context?: string) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, context))
    }
  }

  error(message: string, trace?: unknown, context?: string) {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message, context), trace ?? '')
    }
  }
}
