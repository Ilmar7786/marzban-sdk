import { describe, expect, it, vi } from 'vitest'

import { safeCallback } from './safe-callback'

describe('safeCallback', () => {
  it('forwards the value to the wrapped callback', () => {
    const callback = vi.fn()
    safeCallback(callback, vi.fn())('value')

    expect(callback).toHaveBeenCalledWith('value')
  })

  it('is a no-op when no callback is provided', () => {
    const onFailure = vi.fn()
    expect(() => safeCallback(undefined, onFailure)('value')).not.toThrow()
    expect(onFailure).not.toHaveBeenCalled()
  })

  it('routes a thrown Error to onFailure instead of propagating', () => {
    const error = new Error('boom')
    const onFailure = vi.fn()

    expect(() =>
      safeCallback(() => {
        throw error
      }, onFailure)('value')
    ).not.toThrow()

    expect(onFailure).toHaveBeenCalledWith(error)
  })

  it('routes a thrown non-Error value to onFailure', () => {
    const onFailure = vi.fn()

    safeCallback(() => {
      throw 'not an error'
    }, onFailure)('value')

    expect(onFailure).toHaveBeenCalledWith('not an error')
  })
})
