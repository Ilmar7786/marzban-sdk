import { describe, expect, it } from 'vitest'

import { isSdkDestroyedError } from './errors'
import { Lifecycle } from './lifecycle'

describe('Lifecycle', () => {
  it('starts active (not destroyed)', () => {
    const lifecycle = new Lifecycle()
    expect(lifecycle.destroyed).toBe(false)
  })

  it('assertActive() does not throw while active', () => {
    const lifecycle = new Lifecycle()
    expect(() => lifecycle.assertActive('op')).not.toThrow()
  })

  it('markDestroyed() flips destroyed to true', () => {
    const lifecycle = new Lifecycle()
    lifecycle.markDestroyed()
    expect(lifecycle.destroyed).toBe(true)
  })

  it('markDestroyed() is idempotent', () => {
    const lifecycle = new Lifecycle()
    lifecycle.markDestroyed()
    lifecycle.markDestroyed()
    expect(lifecycle.destroyed).toBe(true)
  })

  it('assertActive() throws SdkDestroyedError once destroyed', () => {
    const lifecycle = new Lifecycle()
    lifecycle.markDestroyed()

    let thrown: unknown
    try {
      lifecycle.assertActive('someOperation')
    } catch (err) {
      thrown = err
    }

    expect(isSdkDestroyedError(thrown)).toBe(true)
  })

  it('SdkDestroyedError carries the failed operation name in details', () => {
    const lifecycle = new Lifecycle()
    lifecycle.markDestroyed()

    let thrown: unknown
    try {
      lifecycle.assertActive('logs.connectByCore')
    } catch (err) {
      thrown = err
    }

    expect(isSdkDestroyedError(thrown) && thrown.details).toEqual({ operation: 'logs.connectByCore' })
  })
})
