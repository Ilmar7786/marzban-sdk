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
  /**
   * Output stream for the built-in logger.
   *
   * `'stdout'` (default) preserves existing behavior via `console.*`.
   * `'stderr'` bypasses `console` and writes straight to `process.stderr` —
   * required for stdio-based transports (e.g. MCP servers), where stdout is
   * reserved for the wire protocol and a single stray byte breaks framing.
   */
  stream?: 'stdout' | 'stderr'
}

export type LoggerConfig = false | LoggerOptions | Logger
