import { describe, expect, it, vi } from 'vitest'

import { closeQuietly } from './close-quietly'

describe('closeQuietly', () => {
  it('returns no failures when close() succeeds', () => {
    const client = { close: vi.fn() }

    expect(closeQuietly(client)).toEqual([])
    expect(client.close).toHaveBeenCalled()
  })

  it('collects the error instead of throwing when close() fails', () => {
    const error = new Error('close failed')
    const client = {
      close: () => {
        throw error
      },
    }

    expect(closeQuietly(client)).toEqual([error])
  })
})
