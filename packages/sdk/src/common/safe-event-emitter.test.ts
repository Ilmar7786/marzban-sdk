import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SafeEventEmitter } from './safe-event-emitter'

type TestEvents = {
  greet: string
  count: number
  data: { id: number; value: string }
  noPayload: undefined
}

describe('SafeEventEmitter', () => {
  let emitter: SafeEventEmitter<TestEvents>

  beforeEach(() => {
    emitter = new SafeEventEmitter<TestEvents>()
  })

  // ─── on ───────────────────────────────────────────────────────────────────

  describe('on', () => {
    it('registers a listener and calls it when the event is emitted', async () => {
      const listener = vi.fn()
      emitter.on('greet', listener)
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(listener).toHaveBeenCalledWith('hello'))
    })

    it('calls multiple listeners registered for the same event', async () => {
      const a = vi.fn()
      const b = vi.fn()
      emitter.on('greet', a)
      emitter.on('greet', b)
      emitter.emit('greet', 'hi')
      await vi.waitFor(() => {
        expect(a).toHaveBeenCalledWith('hi')
        expect(b).toHaveBeenCalledWith('hi')
      })
    })

    it('does not call a listener registered for a different event', async () => {
      const listener = vi.fn()
      emitter.on('greet', listener)
      emitter.emit('count', 1)
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(listener).not.toHaveBeenCalled()
    })

    it('registering the same listener twice does not call it twice (Set deduplication)', async () => {
      const listener = vi.fn()
      emitter.on('greet', listener)
      emitter.on('greet', listener)
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1))
    })

    it('returns this for chaining', () => {
      expect(emitter.on('greet', vi.fn())).toBe(emitter)
    })

    it('passes the correct payload to the listener', async () => {
      const listener = vi.fn()
      emitter.on('data', listener)
      emitter.emit('data', { id: 1, value: 'test' })
      await vi.waitFor(() => expect(listener).toHaveBeenCalledWith({ id: 1, value: 'test' }))
    })
  })

  // ─── once ─────────────────────────────────────────────────────────────────

  describe('once', () => {
    it('calls the listener only on the first emit', async () => {
      const listener = vi.fn()
      emitter.once('greet', listener)
      emitter.emit('greet', 'first')
      emitter.emit('greet', 'second')
      await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1))
      expect(listener).toHaveBeenCalledWith('first')
    })

    it('removes the once listener after execution', async () => {
      const listener = vi.fn()
      emitter.once('greet', listener)
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1))
      expect(emitter.listenerCount('greet')).toBe(0)
    })

    it('returns this for chaining', () => {
      expect(emitter.once('greet', vi.fn())).toBe(emitter)
    })

    it('registering the same once listener twice only calls it once (Set deduplication)', async () => {
      const listener = vi.fn()
      emitter.once('greet', listener)
      emitter.once('greet', listener)
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1))
    })

    it('second emit before async once listener finishes does not re-trigger it', async () => {
      const listener = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
      })
      emitter.once('greet', listener)
      emitter.emit('greet', 'first')
      // second emit fires while the async listener is still running
      emitter.emit('greet', 'second')
      await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1), { timeout: 200 })
    })
  })

  // ─── off ──────────────────────────────────────────────────────────────────

  describe('off', () => {
    it('removes a regular listener', async () => {
      const listener = vi.fn()
      emitter.on('greet', listener)
      emitter.off('greet', listener)
      emitter.emit('greet', 'hello')
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(listener).not.toHaveBeenCalled()
    })

    it('removes a once listener before it fires', async () => {
      const listener = vi.fn()
      emitter.once('greet', listener)
      emitter.off('greet', listener)
      emitter.emit('greet', 'hello')
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(listener).not.toHaveBeenCalled()
    })

    it('is a no-op for an unknown event', () => {
      expect(() => emitter.off('greet', vi.fn())).not.toThrow()
    })

    it('is a no-op for a listener that was never registered', () => {
      const registered = vi.fn()
      const unregistered = vi.fn()
      emitter.on('greet', registered)
      expect(() => emitter.off('greet', unregistered)).not.toThrow()
      expect(emitter.listenerCount('greet')).toBe(1)
    })

    it('returns this for chaining', () => {
      expect(emitter.off('greet', vi.fn())).toBe(emitter)
    })
  })

  // ─── emit ─────────────────────────────────────────────────────────────────

  describe('emit', () => {
    it('returns true when there are regular listeners', () => {
      emitter.on('greet', vi.fn())
      expect(emitter.emit('greet', 'hello')).toBe(true)
    })

    it('returns true when there are only once listeners', () => {
      emitter.once('greet', vi.fn())
      expect(emitter.emit('greet', 'hello')).toBe(true)
    })

    it('returns false when there are no listeners', () => {
      expect(emitter.emit('greet', 'hello')).toBe(false)
    })

    it('returns false after all once listeners have been consumed', async () => {
      emitter.once('greet', vi.fn())
      emitter.emit('greet', 'first')
      await vi.waitFor(() => expect(emitter.listenerCount('greet')).toBe(0))
      expect(emitter.emit('greet', 'second')).toBe(false)
    })

    it('is fire-and-forget — returns synchronously before async listeners complete', async () => {
      const order: string[] = []
      emitter.on('greet', async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
        order.push('listener done')
      })
      emitter.emit('greet', 'hello')
      order.push('after emit')
      expect(order).toEqual(['after emit'])
      await vi.waitFor(() => expect(order).toContain('listener done'))
    })

    it('a throwing sync listener does not propagate the error to the caller', () => {
      emitter.on('greet', () => {
        throw new Error('boom')
      })
      expect(() => emitter.emit('greet', 'hello')).not.toThrow()
    })

    it('a rejecting async listener does not propagate the error to the caller', () => {
      emitter.on('greet', async () => {
        throw new Error('async boom')
      })
      expect(() => emitter.emit('greet', 'hello')).not.toThrow()
    })

    it('a throwing sync listener does not prevent subsequent listeners from running', async () => {
      const second = vi.fn()
      emitter.on('greet', () => {
        throw new Error('boom')
      })
      emitter.on('greet', second)
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(second).toHaveBeenCalled())
    })
  })

  // ─── emitAsync ────────────────────────────────────────────────────────────

  describe('emitAsync', () => {
    it('returns true and resolves after all async listeners complete', async () => {
      const order: string[] = []
      emitter.on('greet', async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
        order.push('listener done')
      })
      const result = await emitter.emitAsync('greet', 'hello')
      order.push('after emitAsync')
      expect(result).toBe(true)
      // unlike emit(), the listener is guaranteed to finish first
      expect(order).toEqual(['listener done', 'after emitAsync'])
    })

    it('returns false when there are no listeners', async () => {
      expect(await emitter.emitAsync('greet', 'hello')).toBe(false)
    })

    it('resolves even if a listener rejects', async () => {
      emitter.on('greet', async () => {
        throw new Error('rejected')
      })
      await expect(emitter.emitAsync('greet', 'hello')).resolves.toBe(true)
    })

    it('resolves even if a sync listener throws', async () => {
      emitter.on('greet', () => {
        throw new Error('sync boom')
      })
      await expect(emitter.emitAsync('greet', 'hello')).resolves.toBe(true)
    })

    it('fires once listeners exactly once and removes them', async () => {
      const listener = vi.fn()
      emitter.once('greet', listener)
      await emitter.emitAsync('greet', 'hello')
      await emitter.emitAsync('greet', 'hello')
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('calls both regular and once listeners when both are registered', async () => {
      const regular = vi.fn()
      const once = vi.fn()
      emitter.on('greet', regular)
      emitter.once('greet', once)
      await emitter.emitAsync('greet', 'hello')
      expect(regular).toHaveBeenCalledWith('hello')
      expect(once).toHaveBeenCalledWith('hello')
      expect(emitter.listenerCount('greet')).toBe(1)
    })
  })

  // ─── removeAllListeners ───────────────────────────────────────────────────

  describe('removeAllListeners', () => {
    it('removes all listeners for a specific event', () => {
      emitter.on('greet', vi.fn())
      emitter.once('greet', vi.fn())
      emitter.removeAllListeners('greet')
      expect(emitter.emit('greet', 'hello')).toBe(false)
    })

    it('does not affect listeners for other events', async () => {
      const listener = vi.fn()
      emitter.on('count', listener)
      emitter.removeAllListeners('greet')
      emitter.emit('count', 1)
      await vi.waitFor(() => expect(listener).toHaveBeenCalledWith(1))
    })

    it('removes all listeners for all events when called without arguments', () => {
      emitter.on('greet', vi.fn())
      emitter.on('count', vi.fn())
      emitter.once('data', vi.fn())
      emitter.removeAllListeners()
      expect(emitter.emit('greet', 'hello')).toBe(false)
      expect(emitter.emit('count', 1)).toBe(false)
      expect(emitter.emit('data', { id: 1, value: 'x' })).toBe(false)
    })
  })

  // ─── listenerCount ────────────────────────────────────────────────────────

  describe('listenerCount', () => {
    it('returns 0 for an event with no listeners', () => {
      expect(emitter.listenerCount('greet')).toBe(0)
    })

    it('counts regular listeners', () => {
      emitter.on('greet', vi.fn())
      emitter.on('greet', vi.fn())
      expect(emitter.listenerCount('greet')).toBe(2)
    })

    it('counts once listeners', () => {
      emitter.once('greet', vi.fn())
      expect(emitter.listenerCount('greet')).toBe(1)
    })

    it('counts both regular and once listeners together', () => {
      emitter.on('greet', vi.fn())
      emitter.once('greet', vi.fn())
      expect(emitter.listenerCount('greet')).toBe(2)
    })

    it('decreases after a once listener fires', async () => {
      emitter.once('greet', vi.fn())
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(emitter.listenerCount('greet')).toBe(0))
    })

    it('decreases after off is called', () => {
      const listener = vi.fn()
      emitter.on('greet', listener)
      emitter.off('greet', listener)
      expect(emitter.listenerCount('greet')).toBe(0)
    })
  })

  // ─── chaining ─────────────────────────────────────────────────────────────

  describe('method chaining', () => {
    it('supports chaining on/once/off', async () => {
      const a = vi.fn()
      const b = vi.fn()
      emitter.on('greet', a).once('greet', b).off('greet', b)
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(a).toHaveBeenCalledWith('hello'))
      expect(b).not.toHaveBeenCalled()
    })
  })

  // ─── async listeners ──────────────────────────────────────────────────────

  describe('async listeners', () => {
    it('calls an async listener and it eventually completes', async () => {
      const listener = vi.fn(async (payload: string) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return payload
      })
      emitter.on('greet', listener)
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(listener).toHaveBeenCalledWith('hello'))
    })

    it('runs multiple async listeners concurrently', async () => {
      const order: number[] = []
      emitter.on('greet', async () => {
        await new Promise(resolve => setTimeout(resolve, 30))
        order.push(1)
      })
      emitter.on('greet', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        order.push(2)
      })
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(order.length).toBe(2), { timeout: 200 })
      // faster listener finishes first
      expect(order).toEqual([2, 1])
    })
  })

  // ─── error resilience ─────────────────────────────────────────────────────

  describe('error resilience', () => {
    it('async rejection does not prevent other async listeners from running', async () => {
      const second = vi.fn()
      emitter.on('greet', async () => {
        throw new Error('rejected')
      })
      emitter.on('greet', async () => second())
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(second).toHaveBeenCalled())
    })

    it('sync throw does not prevent subsequent listeners from running', async () => {
      const second = vi.fn()
      emitter.on('greet', () => {
        throw new Error('sync boom')
      })
      emitter.on('greet', () => second())
      emitter.emit('greet', 'hello')
      await vi.waitFor(() => expect(second).toHaveBeenCalled())
    })
  })
})
