import { describe, expect, it } from 'vitest'

import { renderTable } from './table'

describe('renderTable', () => {
  it('renders a single row as a header + one data row', () => {
    const result = renderTable({ username: 'alice', status: 'active' })
    expect(result).toBe('| username | status |\n| --- | --- |\n| alice | active |')
  })

  it('renders multiple rows', () => {
    const result = renderTable([
      { username: 'alice', status: 'active' },
      { username: 'bob', status: 'disabled' },
    ])
    expect(result).toBe('| username | status |\n| --- | --- |\n| alice | active |\n| bob | disabled |')
  })

  it('unions columns across heterogeneous rows, leaving missing cells blank', () => {
    const result = renderTable([{ a: 1 }, { b: 2 }])
    expect(result).toBe('| a | b |\n| --- | --- |\n| 1 |  |\n|  | 2 |')
  })

  it('renders null as an em dash', () => {
    const result = renderTable({ expire: null })
    expect(result).toBe('| expire |\n| --- |\n| — |')
  })

  it('escapes a literal pipe in a cell value', () => {
    const result = renderTable({ note: 'a|b' })
    expect(result).toBe('| note |\n| --- |\n| a\\|b |')
  })

  it('reports "(no results)" for an empty list', () => {
    expect(renderTable([])).toBe('(no results)')
  })
})
