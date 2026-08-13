/**
 * One page of an offset/limit-paginated endpoint.
 *
 * `total` is optional because not every paginated endpoint reports one —
 * `getUsers` does (`{ users, total }`), but `getAdmins`/`getUserTemplates`
 * return a bare array with no count of the whole collection. When `total` is
 * absent, {@link paginateAll} falls back to stopping on a short or empty
 * page instead of comparing against it.
 */
export interface PageResult<T> {
  items: T[]
  total?: number
}

export interface PaginateAllOptions {
  /**
   * Items requested per page.
   * @default 100
   */
  pageSize?: number
}

/**
 * Walks every page of an offset/limit-paginated endpoint and yields items
 * one at a time, fetching the next page lazily as the caller consumes them.
 *
 * `fetchPage` is your own call to the paginated method, adapted to this
 * shape — nothing here knows about any specific endpoint.
 *
 * Stops when whichever of these is true first: the endpoint reports a
 * `total` and enough items have been seen to reach it, the page came back
 * empty, or the page came back shorter than the requested size (the
 * conventional "this was the last page" signal for endpoints with no
 * `total`).
 *
 * @example
 * ```ts
 * for await (const user of paginateAll((offset, limit) =>
 *   sdk.user.getUsers({ offset, limit }).then(r => ({ items: r.users, total: r.total }))
 * )) {
 *   console.log(user.username)
 * }
 * ```
 *
 * @example Collecting every page into one array
 * ```ts
 * const admins: Admin[] = []
 * for await (const admin of paginateAll((offset, limit) =>
 *   sdk.admin.getAdmins({ offset, limit }).then(items => ({ items }))
 * )) {
 *   admins.push(admin)
 * }
 * ```
 */
export async function* paginateAll<T>(
  fetchPage: (offset: number, limit: number) => Promise<PageResult<T>>,
  options?: PaginateAllOptions
): AsyncGenerator<T, void, unknown> {
  const pageSize = options?.pageSize ?? 100
  let offset = 0

  while (true) {
    const { items, total } = await fetchPage(offset, pageSize)

    for (const item of items) yield item
    offset += items.length

    if (items.length === 0) return
    if (typeof total === 'number' && offset >= total) return
    if (items.length < pageSize) return
  }
}
