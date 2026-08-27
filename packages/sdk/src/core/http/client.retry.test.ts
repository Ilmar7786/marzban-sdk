import { afterEach, describe, expect, it, vi } from 'vitest'

import { AnyType } from '@/common'
import { HttpError } from '@/core/errors'

import { configureHttpClient } from './client'

// Real axios + axios-retry + auth interceptors, transport swapped for a
// counting fake adapter — the only way to prove the full chain (ordering +
// retryCondition) behaves correctly end to end. client.test.ts mocks both
// axios and axios-retry, so it can't observe this.

const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }

const makeAuthService = () =>
  ({
    waitForCurrentAuth: vi.fn().mockResolvedValue(undefined),
    accessToken: 'token',
    authenticate: vi.fn().mockResolvedValue(undefined),
  }) as AnyType

const makeConfig = (retries = 2) => ({ timeout: 30_000, retries }) as AnyType

class FakeAxiosError extends Error {
  isAxiosError = true
  code?: string
  config: AnyType
  response?: { status: number; statusText: string; data: undefined; headers: object; config: AnyType }

  constructor(config: AnyType, opts: { code?: string; status?: number }) {
    super(opts.code ?? `status ${opts.status}`)
    this.code = opts.code
    this.config = config
    if (opts.status !== undefined) {
      this.response = { status: opts.status, statusText: '', data: undefined, headers: {}, config }
    }
  }
}

/** An adapter that fails `failCount` times with `failWith`, then succeeds. */
const makeAdapter = (failCount: number, failWith: { code?: string; status?: number }) => {
  const state = { calls: 0 }
  const adapter = async (config: AnyType) => {
    state.calls += 1
    if (state.calls <= failCount) throw new FakeAxiosError(config, failWith)
    return { data: 'ok', status: 200, statusText: 'OK', headers: {}, config }
  }
  return { adapter, state }
}

describe('configureHttpClient (real axios-retry stack)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('never retries a POST, even on a network error', async () => {
    vi.useFakeTimers()
    const { adapter, state } = makeAdapter(3, { code: 'ECONNRESET' })
    const { client } = configureHttpClient('https://x', makeAuthService(), makeConfig(), logger)

    const pending = client({ url: '/restart', method: 'post', adapter } as AnyType).catch(e => e)
    await vi.runAllTimersAsync()
    const error = await pending

    expect(state.calls).toBe(1)
    expect(error).toBeInstanceOf(HttpError)
  })

  it('retries a GET on a network error up to the configured limit', async () => {
    vi.useFakeTimers()
    const { adapter, state } = makeAdapter(3, { code: 'ECONNRESET' })
    const { client } = configureHttpClient('https://x', makeAuthService(), makeConfig(2), logger)

    const pending = client({ url: '/foo', method: 'get', adapter } as AnyType).catch(e => e)
    await vi.runAllTimersAsync()
    const error = await pending

    expect(state.calls).toBe(3) // 1 initial + 2 retries
    expect(error).toBeInstanceOf(HttpError)
  })

  it('retries a GET on a 500 and resolves once the adapter recovers', async () => {
    vi.useFakeTimers()
    const { adapter, state } = makeAdapter(2, { status: 500 })
    const { client } = configureHttpClient('https://x', makeAuthService(), makeConfig(2), logger)

    const pending = client({ url: '/foo', method: 'get', adapter } as AnyType)
    await vi.runAllTimersAsync()
    const response = await pending

    expect(state.calls).toBe(3)
    expect(response).toMatchObject({ data: 'ok' })
  })

  it('does not retry a GET on a 404', async () => {
    const { adapter, state } = makeAdapter(1, { status: 404 })
    const { client } = configureHttpClient('https://x', makeAuthService(), makeConfig(), logger)

    const error = await client({ url: '/foo', method: 'get', adapter } as AnyType).catch(e => e)

    expect(state.calls).toBe(1)
    expect((error as HttpError).status).toBe(404)
  })

  it('retries a login POST on the public client', async () => {
    vi.useFakeTimers()
    const { adapter, state } = makeAdapter(1, { code: 'ECONNRESET' })
    const { publicClient } = configureHttpClient('https://x', makeAuthService(), makeConfig(), logger)

    const pending = publicClient({ url: '/login', method: 'post', adapter } as AnyType)
    await vi.runAllTimersAsync()
    const response = await pending

    expect(state.calls).toBe(2)
    expect(response).toMatchObject({ data: 'ok' })
  })

  it('re-authenticates once on a 401 without engaging the retry loop', async () => {
    const { adapter, state } = makeAdapter(1, { status: 401 })
    const authService = makeAuthService()
    const { client } = configureHttpClient('https://x', authService, makeConfig(), logger)

    const response = await client({ url: '/foo', method: 'get', adapter } as AnyType)

    expect(authService.authenticate).toHaveBeenCalledTimes(1)
    expect(state.calls).toBe(2)
    expect(response).toMatchObject({ data: 'ok' })
  })
})
