import type { ViewRow } from './views/types'

function formatCell(value: ViewRow[string] | undefined): string {
  if (value === undefined) return ''
  if (value === null) return '—'
  return String(value).replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
}

/** Renders rows as a markdown table. Column set is the union of keys across all rows (heterogeneous rows get blank cells), so a single view can mix shapes without the caller normalizing first. */
export function renderTable(rows: ViewRow | ViewRow[]): string {
  const list = Array.isArray(rows) ? rows : [rows]
  if (list.length === 0) return '(no results)'

  const columns = [...new Set(list.flatMap(row => Object.keys(row)))]
  const header = `| ${columns.join(' | ')} |`
  const separator = `| ${columns.map(() => '---').join(' | ')} |`
  const dataRows = list.map(row => `| ${columns.map(column => formatCell(row[column])).join(' | ')} |`)

  return [header, separator, ...dataRows].join('\n')
}
