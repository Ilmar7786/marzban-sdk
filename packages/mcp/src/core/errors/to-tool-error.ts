import type { CallToolResult } from '@modelcontextprotocol/server'
import { isAuthError, isConfigurationError, isHttpError, isSdkError } from 'marzban-sdk'
import { z } from 'zod'

import { redactText } from '@/shared/redact-text'

import { ToolError } from './mcp.error'

function textResult(text: string): CallToolResult {
  return { content: [{ type: 'text', text: redactText(text) }], isError: true }
}

/** Maps any error a tool handler can throw into a `CallToolResult` with `isError: true`. Never throws itself. */
export function toToolError(error: unknown): CallToolResult {
  if (error instanceof ToolError) {
    const hint = error.hint ? `\nHint: ${error.hint}` : ''
    return textResult(`${error.message}${hint}`)
  }

  if (error instanceof z.ZodError) {
    const issues = error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n')
    return textResult(`Invalid arguments:\n${issues}`)
  }

  if (isAuthError(error)) {
    return textResult(
      `${error.message}\nHint: authentication with the Marzban panel failed — check MARZBAN_USERNAME/MARZBAN_PASSWORD.`
    )
  }

  if (isHttpError(error)) {
    const suffix = error.status === undefined ? '' : ` (HTTP ${error.status})`
    return textResult(`Marzban API request failed${suffix}: ${error.message}`)
  }

  if (isConfigurationError(error)) {
    return textResult(`${error.message}\nHint: check the marzban-mcp environment configuration.`)
  }

  if (isSdkError(error)) {
    return textResult(`${error.code}: ${error.message}`)
  }

  if (error instanceof Error) {
    return textResult(error.message)
  }

  return textResult(`Unexpected error: ${String(error)}`)
}
