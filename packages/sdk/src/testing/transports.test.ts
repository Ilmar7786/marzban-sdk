import { afterEach, describe, expect, it, vi } from 'vitest'

import { selectWsTransport, WS_TRANSPORTS } from './transports'

describe('selectWsTransport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists the native and ws-package transports', () => {
    expect(WS_TRANSPORTS).toEqual(['native', 'ws-package'])
  })

  it('leaves the native global WebSocket untouched', () => {
    const native = globalThis.WebSocket

    selectWsTransport('native')

    expect(globalThis.WebSocket).toBe(native)
  })

  it('removes the global WebSocket to force the ws-package transport', () => {
    selectWsTransport('ws-package')

    expect(globalThis.WebSocket).toBeUndefined()
  })
})
