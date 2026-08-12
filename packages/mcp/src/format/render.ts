import type { CallToolResult } from '@modelcontextprotocol/server'

import { renderJson } from './json'
import { renderTable } from './table'
import { renderText } from './text'
import { truncate } from './truncate'
import type { View } from './views/types'

export type OutputFormat = 'text' | 'table' | 'json'
export type Verbosity = 'compact' | 'full'

export interface RenderOptions {
  format: OutputFormat
  verbosity: Verbosity
  maxChars: number
}

/**
 * Projects `data` through `view` (compact by default, `full` only when
 * requested and available) and lays it out per `format`. `structuredContent`
 * always carries the raw, unprojected `data` — full fidelity for programmatic
 * consumption, while `content` stays compact for token economy (see plan §5).
 */
export function render<T>(data: T, view: View<T>, options: RenderOptions): CallToolResult {
  const projector = options.verbosity === 'full' && view.full ? view.full : view.compact
  const rows = projector(data)

  const rendered =
    options.format === 'table' ? renderTable(rows) : options.format === 'json' ? renderJson(rows) : renderText(rows)

  const { text } = truncate(rendered, options.maxChars)

  return {
    content: [{ type: 'text', text }],
    structuredContent: data,
  }
}
