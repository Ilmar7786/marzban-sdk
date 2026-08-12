import { describe, expect, it } from 'vitest'

import { render } from './render'
import type { View } from './views/types'

interface Fixture {
  username: string
  usedBytes: number
}

const view: View<Fixture> = {
  compact: data => ({ username: data.username }),
  full: data => ({ username: data.username, usedBytes: data.usedBytes }),
}

const fixture: Fixture = { username: 'alice', usedBytes: 12345 }

describe('render', () => {
  it('uses the compact projection by default', () => {
    const result = render(fixture, view, { format: 'text', verbosity: 'compact', maxChars: 8000, showLinks: false })
    expect(result.content).toEqual([{ type: 'text', text: 'username: alice' }])
  })

  it('uses the full projection when verbosity is full and the view provides one', () => {
    const result = render(fixture, view, { format: 'text', verbosity: 'full', maxChars: 8000, showLinks: false })
    expect(result.content).toEqual([{ type: 'text', text: 'username: alice | usedBytes: 12345' }])
  })

  it('falls back to compact when verbosity is full but the view has no full projection', () => {
    const compactOnly: View<Fixture> = { compact: data => ({ username: data.username }) }
    const result = render(fixture, compactOnly, { format: 'text', verbosity: 'full', maxChars: 8000, showLinks: false })
    expect(result.content).toEqual([{ type: 'text', text: 'username: alice' }])
  })

  it('renders as a markdown table when format is table', () => {
    const result = render(fixture, view, { format: 'table', verbosity: 'compact', maxChars: 8000, showLinks: false })
    expect((result.content[0] as { text: string }).text).toBe('| username |\n| --- |\n| alice |')
  })

  it('renders as JSON when format is json', () => {
    const result = render(fixture, view, { format: 'json', verbosity: 'compact', maxChars: 8000, showLinks: false })
    expect((result.content[0] as { text: string }).text).toBe('{"username":"alice"}')
  })

  it('always carries the raw, unprojected data as structuredContent', () => {
    const result = render(fixture, view, { format: 'json', verbosity: 'compact', maxChars: 8000, showLinks: false })
    expect(result.structuredContent).toBe(fixture)
  })

  it('truncates the rendered content to the configured character budget', () => {
    const wideView: View<Fixture> = { compact: data => ({ username: data.username.repeat(100) }) }
    const result = render(fixture, wideView, { format: 'text', verbosity: 'compact', maxChars: 20, showLinks: false })
    expect((result.content[0] as { text: string }).text).toContain('truncated')
  })

  it('passes showLinks through to the view', () => {
    const spyView: View<Fixture> = {
      compact: (data, options) => ({ username: data.username, showLinks: options.showLinks }),
    }
    const shown = render(fixture, spyView, { format: 'json', verbosity: 'compact', maxChars: 8000, showLinks: true })
    const hidden = render(fixture, spyView, { format: 'json', verbosity: 'compact', maxChars: 8000, showLinks: false })
    expect((shown.content[0] as { text: string }).text).toContain('"showLinks":true')
    expect((hidden.content[0] as { text: string }).text).toContain('"showLinks":false')
  })
})
