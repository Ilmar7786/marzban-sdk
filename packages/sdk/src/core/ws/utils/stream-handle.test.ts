import { describe, expect, it, vi } from 'vitest'

import { createStreamHandle } from './stream-handle'

describe('createStreamHandle', () => {
  it('is callable and closing it closes the source', () => {
    const close = vi.fn()
    const handle = createStreamHandle({ close, state: 'open' as const })

    handle()

    expect(close).toHaveBeenCalledTimes(1)
  })

  it('exposes an explicit close() that closes the source', () => {
    const close = vi.fn()
    const handle = createStreamHandle({ close, state: 'open' as const })

    handle.close()

    expect(close).toHaveBeenCalledTimes(1)
  })

  it('reads state live — a change on the source is visible without re-wrapping', () => {
    const source = { close: vi.fn(), state: 'connecting' as string }
    const handle = createStreamHandle(source)

    expect(handle.state).toBe('connecting')

    source.state = 'closed'

    expect(handle.state).toBe('closed')
  })

  it('is a function', () => {
    const handle = createStreamHandle({ close: vi.fn(), state: 'open' as const })

    expect(typeof handle).toBe('function')
  })
})
