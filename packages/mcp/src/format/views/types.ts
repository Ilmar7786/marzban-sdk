/**
 * One display-ready row: values are pre-formatted primitives (dates, byte
 * sizes, enums already turned into strings by the view itself, using the
 * SDK's own `formatBytes`/`humanRemaining`/etc.) so `format/text.ts` and
 * `format/table.ts` never need domain knowledge — they only lay out rows.
 */
export type ViewRow = Record<string, string | number | boolean | null>

/** Runtime knobs a view may need beyond the data itself — currently just whether credential-bearing fields (`proxies`, `subscription_url`, `links`) may be shown in full (plan §4.4). */
export interface ViewOptions {
  showLinks: boolean
}

/** Projects raw SDK/domain data (`T`) into display rows at two verbosity levels. `compact` is used by default; `full` only when `verbosity: 'full'` and the view provides one. */
export interface View<T> {
  compact(data: T, options: ViewOptions): ViewRow | ViewRow[]
  full?(data: T, options: ViewOptions): ViewRow | ViewRow[]
}
