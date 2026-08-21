import { describe, expect, it } from 'vitest'

import { clampLimit, DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT, paginationNote } from './pagination'

describe('clampLimit', () => {
  it('defaults to DEFAULT_PAGE_LIMIT when undefined', () => {
    expect(clampLimit(undefined)).toBe(DEFAULT_PAGE_LIMIT)
  })

  it('passes a value inside the valid range through unchanged', () => {
    expect(clampLimit(50)).toBe(50)
  })

  it('clamps values above MAX_PAGE_LIMIT down to it', () => {
    expect(clampLimit(1000)).toBe(MAX_PAGE_LIMIT)
  })

  it('clamps values below 1 up to 1', () => {
    expect(clampLimit(0)).toBe(1)
    expect(clampLimit(-5)).toBe(1)
  })

  it('floors a fractional value', () => {
    expect(clampLimit(10.9)).toBe(10)
  })
})

describe('paginationNote', () => {
  it('reports every item shown when shown >= total', () => {
    expect(paginationNote(25, 25, 0)).toBe('Showing all 25.')
  })

  it('reports a partial page with the offset to continue from', () => {
    expect(paginationNote(25, 100, 0)).toBe('Showing 25 of 100 (offset=0). Pass a higher offset to see more.')
  })
})
