import { describe, expect, it } from 'vitest'

import { renderText } from './text'

describe('renderText', () => {
  it('renders a single row as key: value pairs', () => {
    const result = renderText({ username: 'alice', status: 'active' })
    expect(result).toBe('username: alice | status: active')
  })

  it('renders multiple rows one per line', () => {
    const result = renderText([
      { username: 'alice', status: 'active' },
      { username: 'bob', status: 'disabled' },
    ])
    expect(result).toBe('username: alice | status: active\nusername: bob | status: disabled')
  })

  it('renders null as an em dash', () => {
    const result = renderText({ expire: null })
    expect(result).toBe('expire: —')
  })

  it('renders numbers and booleans as their string form', () => {
    const result = renderText({ count: 5, active: true })
    expect(result).toBe('count: 5 | active: true')
  })

  it('reports "(no results)" for an empty list', () => {
    expect(renderText([])).toBe('(no results)')
  })
})
