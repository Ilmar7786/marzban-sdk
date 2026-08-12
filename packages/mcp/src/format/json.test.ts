import { describe, expect, it } from 'vitest'

import { renderJson } from './json'

describe('renderJson', () => {
  it('renders a single row as compact JSON', () => {
    expect(renderJson({ username: 'alice' })).toBe('{"username":"alice"}')
  })

  it('renders multiple rows as a compact JSON array', () => {
    expect(renderJson([{ a: 1 }, { b: 2 }])).toBe('[{"a":1},{"b":2}]')
  })

  it('renders an empty list as []', () => {
    expect(renderJson([])).toBe('[]')
  })
})
