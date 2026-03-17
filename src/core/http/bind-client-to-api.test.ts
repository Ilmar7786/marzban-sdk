import { describe, expect, it, vi } from 'vitest'

import { bindClientToApi } from './bind-client-to-api'
import type { ClientFn } from './client'

const makeClient = (): ClientFn => vi.fn().mockResolvedValue({ data: {}, status: 200, statusText: 'OK' })

describe('bindClientToApi', () => {
  describe('basic binding', () => {
    it('returns an object with the same keys as the input api', () => {
      const api = { getUsers: vi.fn(), createUser: vi.fn() }
      const bound = bindClientToApi(api, makeClient())
      expect(Object.keys(bound)).toEqual(['getUsers', 'createUser'])
    })

    it('wraps each method so the original is not called directly', () => {
      const original = vi.fn()
      const api = { doSomething: original }
      const bound = bindClientToApi(api, makeClient())
      bound.doSomething()
      expect(original).toHaveBeenCalled()
    })

    it('returns a new object (does not mutate the original api)', () => {
      const api = { getUsers: vi.fn() }
      const bound = bindClientToApi(api, makeClient())
      expect(bound).not.toBe(api)
    })
  })

  describe('client injection — single argument (no config)', () => {
    it('appends { client } as the last argument when called with no args', () => {
      const original = vi.fn()
      const client = makeClient()
      const bound = bindClientToApi({ fn: original }, client)
      bound.fn()
      expect(original).toHaveBeenCalledWith({ client })
    })

    it('appends { client } when called with a single non-object argument', () => {
      const original = vi.fn()
      const client = makeClient()
      const bound = bindClientToApi({ fn: original }, client)
      bound.fn('param')
      expect(original).toHaveBeenCalledWith('param', { client })
    })

    it('appends { client } when called with a single object argument (treated as params, not config)', () => {
      const original = vi.fn()
      const client = makeClient()
      const bound = bindClientToApi({ fn: original }, client)
      bound.fn({ page: 1 })
      // single arg — not treated as config, client appended
      expect(original).toHaveBeenCalledWith({ page: 1 }, { client })
    })
  })

  describe('client injection — two or more arguments', () => {
    it('merges client into last object argument when called with two args', () => {
      const original = vi.fn()
      const client = makeClient()
      const bound = bindClientToApi({ fn: original }, client)
      bound.fn({ username: 'alice' }, { headers: { 'x-custom': '1' } })
      expect(original).toHaveBeenCalledWith({ username: 'alice' }, { headers: { 'x-custom': '1' }, client })
    })

    it('does not duplicate client if already present in last arg', () => {
      const original = vi.fn()
      const client = makeClient()
      const bound = bindClientToApi({ fn: original }, client)
      const existingConfig = { headers: {} }
      bound.fn({ id: 1 }, existingConfig)
      const callArgs = original.mock.calls[0]
      const lastArg = callArgs[callArgs.length - 1] as Record<string, unknown>
      expect(lastArg.client).toBe(client)
    })

    it('appends { client } when last arg is not an object', () => {
      const original = vi.fn()
      const client = makeClient()
      const bound = bindClientToApi({ fn: original }, client)
      bound.fn({ id: 1 }, 'not-an-object')
      expect(original).toHaveBeenCalledWith({ id: 1 }, 'not-an-object', { client })
    })

    it('appends { client } when last arg is null', () => {
      const original = vi.fn()
      const client = makeClient()
      const bound = bindClientToApi({ fn: original }, client)
      bound.fn({ id: 1 }, null)
      expect(original).toHaveBeenCalledWith({ id: 1 }, null, { client })
    })

    it('appends { client } when last arg is an array', () => {
      const original = vi.fn()
      const client = makeClient()
      const bound = bindClientToApi({ fn: original }, client)
      bound.fn({ id: 1 }, [1, 2, 3])
      expect(original).toHaveBeenCalledWith({ id: 1 }, [1, 2, 3], { client })
    })
  })

  describe('original function is called with correct context', () => {
    it('forwards the return value of the original function', async () => {
      const client = makeClient()
      const api = { getUser: vi.fn().mockResolvedValue({ id: 1 }) }
      const bound = bindClientToApi(api, client)
      const result = await bound.getUser({ id: 1 }, {})
      expect(result).toEqual({ id: 1 })
    })

    it('propagates errors thrown by the original function', async () => {
      const client = makeClient()
      const api = { failingMethod: vi.fn().mockRejectedValue(new Error('boom')) }
      const bound = bindClientToApi(api, client)
      await expect(bound.failingMethod({}, {})).rejects.toThrow('boom')
    })
  })

  describe('multiple methods', () => {
    it('injects client independently into each method', () => {
      const getUsers = vi.fn()
      const createUser = vi.fn()
      const client = makeClient()
      const bound = bindClientToApi({ getUsers, createUser }, client)

      bound.getUsers({ page: 1 }, {})
      bound.createUser({ username: 'bob' }, {})

      expect(getUsers).toHaveBeenCalledWith({ page: 1 }, { client })
      expect(createUser).toHaveBeenCalledWith({ username: 'bob' }, { client })
    })
  })
})
