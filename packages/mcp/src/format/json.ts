import type { ViewRow } from './views/types'

/** Renders rows as compact (unindented) JSON — indentation would only spend tokens without adding information a model needs. */
export function renderJson(rows: ViewRow | ViewRow[]): string {
  return JSON.stringify(rows)
}
