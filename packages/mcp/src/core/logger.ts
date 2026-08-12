export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface McpLogger {
  debug(message: string, context?: string): void
  info(message: string, context?: string): void
  warn(message: string, context?: string): void
  error(message: string, err?: unknown, context?: string): void
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

function formatError(err: unknown): string {
  if (err instanceof Error) return err.stack ?? err.message
  if (err === undefined) return ''
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

// stdout is reserved for JSON-RPC framing (see index.ts) — every write here
// goes to stderr via process.stderr, never console.log.
export function createStderrLogger(level: LogLevel): McpLogger {
  const write = (msgLevel: LogLevel, message: string, context?: string): void => {
    if (LEVEL_ORDER[msgLevel] < LEVEL_ORDER[level]) return
    const prefix = context ? `[${context}] ` : ''
    process.stderr.write(`${new Date().toISOString()} ${msgLevel.toUpperCase()} ${prefix}${message}\n`)
  }

  return {
    debug: (message, context) => write('debug', message, context),
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, err, context) => {
      const errText = formatError(err)
      write('error', errText ? `${message}: ${errText}` : message, context)
    },
  }
}
