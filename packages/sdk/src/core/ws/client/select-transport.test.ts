import { afterEach, describe, expect, it, vi } from 'vitest'

import { selectWsTransportKind, transportSupportsHeaders } from './select-transport'

describe('selectWsTransportKind', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('picks native when a native WebSocket is available and no agent is set', () => {
    vi.stubGlobal('WebSocket', class {})

    expect(selectWsTransportKind()).toBe('native')
    expect(selectWsTransportKind({})).toBe('native')
  })

  it('falls back to the ws package when there is no native WebSocket', () => {
    vi.stubGlobal('WebSocket', undefined)

    expect(selectWsTransportKind()).toBe('ws-package')
  })

  it('forces the ws package when an agent is configured outside the browser, even with a native WebSocket', () => {
    vi.stubGlobal('WebSocket', class {})

    expect(selectWsTransportKind({ agent: { destroy: vi.fn() } })).toBe('ws-package')
  })

  it('ignores the agent and stays on native inside the browser', () => {
    vi.stubGlobal('WebSocket', class {})
    vi.stubGlobal('window', { document: {} })

    expect(selectWsTransportKind({ agent: { destroy: vi.fn() } })).toBe('native')
  })
})

describe('transportSupportsHeaders', () => {
  it('is true only for the ws package — the native WebSocket constructor has no headers option', () => {
    expect(transportSupportsHeaders('ws-package')).toBe(true)
    expect(transportSupportsHeaders('native')).toBe(false)
  })
})
