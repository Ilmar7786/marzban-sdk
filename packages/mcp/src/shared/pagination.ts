export const DEFAULT_PAGE_LIMIT = 25
export const MAX_PAGE_LIMIT = 100

/** Clamps a caller-supplied `limit` into `[1, MAX_PAGE_LIMIT]`, defaulting to `DEFAULT_PAGE_LIMIT` when omitted — see plan §5 on why an unbounded list call is never allowed to reach the API. */
export function clampLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_PAGE_LIMIT
  return Math.min(Math.max(1, Math.floor(limit)), MAX_PAGE_LIMIT)
}

/** A one-line, honest paging hint — silently returning a partial list reads to a model as "this is everything" (plan §5). */
export function paginationNote(shown: number, total: number, offset: number): string {
  if (shown >= total) return `Showing all ${total}.`
  return `Showing ${shown} of ${total} (offset=${offset}). Pass a higher offset to see more.`
}
