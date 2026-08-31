import { describe, expect, it, vi } from 'vitest'

import { AnyType } from '@/common'

import { HttpError } from '../errors'
import { TolerantUserApi } from './tolerant-user-api'

// A minimal userResponseSchema-valid payload — only used to make a
// successful getUser() call resolve without a schema-validation error.
const EXISTING_USER = {
  proxies: {},
  username: 'orphantest',
  status: 'active',
  used_traffic: 0,
  created_at: '2026-01-01T00:00:00',
}

function httpError(status: number): HttpError {
  return new HttpError({ response: { status } })
}

function mockClient(): AnyType {
  return vi.fn()
}

describe('TolerantUserApi', () => {
  it('returns the response as-is when removeUser succeeds directly', async () => {
    const client = mockClient()
    client.mockResolvedValueOnce({ data: { detail: 'User successfully deleted' } })
    const api = new TolerantUserApi({ client })

    await expect(api.removeUser('someuser')).resolves.toEqual({ detail: 'User successfully deleted' })
    expect(client).toHaveBeenCalledTimes(1)
  })

  it('rethrows a non-500 HttpError without confirming via getUser', async () => {
    const client = mockClient()
    client.mockRejectedValueOnce(httpError(404))
    const api = new TolerantUserApi({ client })

    await expect(api.removeUser('someuser')).rejects.toMatchObject({ status: 404 })
    expect(client).toHaveBeenCalledTimes(1)
  })

  it('rethrows a non-HttpError without confirming via getUser', async () => {
    const networkError = new Error('socket hang up')
    const client = mockClient()
    client.mockRejectedValueOnce(networkError)
    const api = new TolerantUserApi({ client })

    await expect(api.removeUser('someuser')).rejects.toBe(networkError)
    expect(client).toHaveBeenCalledTimes(1)
  })

  it('treats a 500 as success once a follow-up getUser confirms 404', async () => {
    const client = mockClient()
    client.mockRejectedValueOnce(httpError(500)).mockRejectedValueOnce(httpError(404))
    const api = new TolerantUserApi({ client })

    await expect(api.removeUser('orphantest')).resolves.toEqual({ detail: 'User successfully deleted' })
    expect(client).toHaveBeenCalledTimes(2)
  })

  it('rethrows the original 500 when the follow-up getUser shows the user still exists', async () => {
    const client = mockClient()
    client.mockRejectedValueOnce(httpError(500)).mockResolvedValueOnce({ data: EXISTING_USER })
    const api = new TolerantUserApi({ client })

    await expect(api.removeUser('orphantest')).rejects.toMatchObject({ status: 500 })
    expect(client).toHaveBeenCalledTimes(2)
  })

  it('rethrows the original 500 when the follow-up getUser fails with a non-404 HttpError', async () => {
    const client = mockClient()
    client.mockRejectedValueOnce(httpError(500)).mockRejectedValueOnce(httpError(401))
    const api = new TolerantUserApi({ client })

    await expect(api.removeUser('orphantest')).rejects.toMatchObject({ status: 500 })
    expect(client).toHaveBeenCalledTimes(2)
  })

  it('rethrows the original 500 when the follow-up getUser fails with a non-HttpError', async () => {
    const client = mockClient()
    client.mockRejectedValueOnce(httpError(500)).mockRejectedValueOnce(new Error('socket hang up'))
    const api = new TolerantUserApi({ client })

    await expect(api.removeUser('orphantest')).rejects.toMatchObject({ status: 500 })
    expect(client).toHaveBeenCalledTimes(2)
  })
})
