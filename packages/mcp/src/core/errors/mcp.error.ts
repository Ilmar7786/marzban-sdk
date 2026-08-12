export type ToolErrorCode =
  | 'INVALID_ARGUMENTS'
  | 'AUTH_ERROR'
  | 'HTTP_ERROR'
  | 'CONFIG_ERROR'
  | 'SDK_ERROR'
  | 'CONFIRMATION_REQUIRED'
  | 'INTERNAL_ERROR'

/** A tool-facing error with an actionable hint. Thrown by module handlers; mapped to a `CallToolResult` by `toToolError`. */
export class ToolError extends Error {
  readonly code: ToolErrorCode
  readonly hint?: string

  constructor(code: ToolErrorCode, message: string, hint?: string) {
    super(message)
    this.name = 'ToolError'
    this.code = code
    this.hint = hint
  }
}
