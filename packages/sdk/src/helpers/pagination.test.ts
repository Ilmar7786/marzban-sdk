import { describe, expect, it, vi } from 'vitest'

import { paginateAll } from './pagination'

async function collect<T>(gen: AsyncGenerator<T, void, unknown>): Promise<T[]> {
  const out: T[] = []
  for await (const item of gen) out.push(item)
  return out
}

describe('paginateAll', () => {
  it('stops using total once enough items have been seen, across exactly-full pages', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: ['a', 'b'], total: 4 })
      .mockResolvedValueOnce({ items: ['c', 'd'], total: 4 })

    const items = await collect(paginateAll(fetchPage, { pageSize: 2 }))

    expect(items).toEqual(['a', 'b', 'c', 'd'])
    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, 2)
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 2)
  })

  it('stops on an empty page when the endpoint reports no total', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: ['a', 'b'] })
      .mockResolvedValueOnce({ items: [] })

    const items = await collect(paginateAll(fetchPage, { pageSize: 2 }))

    expect(items).toEqual(['a', 'b'])
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('stops on a short (but non-empty) page when the endpoint reports no total', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: ['a', 'b'] })
      .mockResolvedValueOnce({ items: ['c'] })

    const items = await collect(paginateAll(fetchPage, { pageSize: 2 }))

    expect(items).toEqual(['a', 'b', 'c'])
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('defaults pageSize to 100', async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce({ items: [] })

    await collect(paginateAll(fetchPage))

    expect(fetchPage).toHaveBeenCalledWith(0, 100)
  })

  it('yields nothing when the first page is already empty', async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce({ items: [], total: 0 })

    const items = await collect(paginateAll(fetchPage))

    expect(items).toEqual([])
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })
})
