import type { ViewRow } from './views/types'

function formatCell(value: ViewRow[string] | undefined): string {
  if (value === undefined || value === null) return '—'
  return String(value)
}

/** Renders rows as compact `key: value` lines — one row per line, joined with `|`. Token-cheaper than a markdown table while staying readable. */
export function renderText(rows: ViewRow | ViewRow[]): string {
  const list = Array.isArray(rows) ? rows : [rows]
  if (list.length === 0) return '(no results)'

  return list
    .map(row =>
      Object.entries(row)
        .map(([key, value]) => `${key}: ${formatCell(value)}`)
        .join(' | ')
    )
    .join('\n')
}
