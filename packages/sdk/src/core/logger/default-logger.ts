import chalk, { type ChalkInstance } from 'chalk'

import { Logger, LoggerOptions, LogLevel } from './logger.types'
import { getDefaultLogLevel } from './logger.utils'

export class DefaultLogger implements Logger {
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  private readonly levelColors: Record<LogLevel, ChalkInstance> = {
    debug: chalk.magenta,
    info: chalk.blue,
    warn: chalk.yellow,
    error: chalk.red,
  }

  private currentLevel: LogLevel
  private timestamp: boolean
  private stream: 'stdout' | 'stderr'

  constructor(options?: LoggerOptions) {
    // An explicit level always wins; otherwise fall back to the env-based
    // default (info in development, error in production).
    this.currentLevel = options?.level ?? getDefaultLogLevel()
    this.timestamp = options?.timestamp ?? true
    this.stream = options?.stream ?? 'stdout'
  }

  private shouldLog(level: LogLevel) {
    return this.levelPriority[level] >= this.levelPriority[this.currentLevel]
  }

  /**
   * stdout mode keeps chalk's own auto-detection (unchanged, existing
   * behavior). stderr mode uses its own TTY check: a stdio server's stdout
   * carries the wire protocol and must never see ANSI escapes, but stderr
   * gets colored when it's actually a terminal.
   */
  private useColor(): boolean {
    if (this.stream === 'stdout') return true
    if (typeof process === 'undefined' || !process.stderr || process.env?.NO_COLOR) return false
    return Boolean(process.stderr.isTTY)
  }

  private format(level: LogLevel, message: string, context?: string) {
    const ts = this.timestamp ? `${new Date().toISOString()}` : ''
    const color = this.useColor()
    const ctx = context ? (color ? chalk.cyan(`[${context}]`) : `[${context}]`) : ''
    const levelLabel = level.toUpperCase().padStart(5, ' ')
    const paddedLevel = color ? this.levelColors[level](levelLabel) : levelLabel
    const sdkPrefix = color ? chalk.green('[MarzbanSDK]') : '[MarzbanSDK]'

    return `${sdkPrefix} ${ts} ${paddedLevel} ${ctx} ${message}`.trim()
  }

  /**
   * Writes a pre-formatted line straight to `process.stderr`, bypassing
   * `console` entirely. In Node, `console.debug`/`console.info` write to
   * stdout — exactly the stream a stdio MCP server reserves for JSON-RPC —
   * so `stream: 'stderr'` must never go through them.
   */
  private toStderr(line: string, trace?: unknown) {
    if (typeof process === 'undefined' || !process.stderr?.write) {
      // No process.stderr in this runtime (e.g. browser) — console.error is
      // the closest equivalent and keeps output off the primary console sink.
      console.error(line, trace ?? '')
      return
    }
    const traceText = trace instanceof Error ? (trace.stack ?? trace.message) : trace ? String(trace) : ''
    process.stderr.write(traceText ? `${line} ${traceText}\n` : `${line}\n`)
  }

  debug(message: string, context?: string) {
    if (!this.shouldLog('debug')) return
    const line = this.format('debug', message, context)
    if (this.stream === 'stderr') return this.toStderr(line)
    console.debug(line)
  }

  info(message: string, context?: string) {
    if (!this.shouldLog('info')) return
    const line = this.format('info', message, context)
    if (this.stream === 'stderr') return this.toStderr(line)
    console.info(line)
  }

  warn(message: string, context?: string) {
    if (!this.shouldLog('warn')) return
    const line = this.format('warn', message, context)
    if (this.stream === 'stderr') return this.toStderr(line)
    console.warn(line)
  }

  error(message: string, trace?: unknown, context?: string) {
    if (!this.shouldLog('error')) return
    const line = this.format('error', message, context)
    if (this.stream === 'stderr') return this.toStderr(line, trace)
    console.error(line, trace ?? '')
  }
}
