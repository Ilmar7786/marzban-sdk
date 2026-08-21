import type { CallToolResult } from '@modelcontextprotocol/server'
import { isAuthError, isConfigurationError, isHttpError, isSdkError } from 'marzban-sdk'
import { z } from 'zod'

import { redactText } from '@/shared/redact-text'

import { ToolError } from './mcp.error'

// HttpError.details wraps a raw axios error (redacted, but still `unknown` —
// marzban-sdk doesn't type it yet, tracked as P3). Duck-typing the status out
// of it is the same best-effort every other current consumer of the SDK has
// to do; there's no safer option until P3 lands.
function extractHttpStatus(details: unknown): number | undefined {
  if (typeof details !== 'object' || details === null) return undefined
  const response = (details as { response?: unknown }).response
  if (typeof response !== 'object' || response === null) return undefined
  const status = (response as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

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
    const status = extractHttpStatus(error.details)
    const statusText = status ? ` (HTTP ${status})` : ''
    return textResult(`Marzban API request failed${statusText}: ${error.message}`)
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
