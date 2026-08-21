import type { ServerContext } from '@modelcontextprotocol/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createConfirmTokenCodec } from './token'

const ctx = {} as ServerContext

function makeCodec() {
  return createConfirmTokenCodec(new Uint8Array(32).fill(7))
}

describe('createConfirmTokenCodec', () => {
  it('mints a token that verifies for the same tool and arguments', async () => {
    const codec = makeCodec()
    const token = await codec.mint('marzban_users_delete', { username: 'alice' }, ctx)
    const result = await codec.verify(token, 'marzban_users_delete', { username: 'alice' }, ctx)
    expect(result).toEqual({ ok: true })
  })

  it('rejects a garbage/tampered token as malformed', async () => {
    const codec = makeCodec()
    const result = await codec.verify('not-a-real-token', 'marzban_users_delete', { username: 'alice' }, ctx)
    expect(result).toEqual({ ok: false, reason: 'malformed' })
  })

  it('rejects a token replayed against a different tool', async () => {
    const codec = makeCodec()
    const token = await codec.mint('marzban_users_delete', { username: 'alice' }, ctx)
    const result = await codec.verify(token, 'marzban_users_reset_traffic', { username: 'alice' }, ctx)
    expect(result).toEqual({ ok: false, reason: 'tool-mismatch' })
  })

  it('rejects a token replayed against different arguments', async () => {
    const codec = makeCodec()
    const token = await codec.mint('marzban_users_delete', { username: 'alice' }, ctx)
    const result = await codec.verify(token, 'marzban_users_delete', { username: 'bob' }, ctx)
    expect(result).toEqual({ ok: false, reason: 'args-mismatch' })
  })

  it('ignores confirmToken itself when hashing arguments', async () => {
    const codec = makeCodec()
    const token = await codec.mint('marzban_users_delete', { username: 'alice', confirmToken: 'irrelevant' }, ctx)
    const result = await codec.verify(token, 'marzban_users_delete', { username: 'alice' }, ctx)
    expect(result).toEqual({ ok: true })
  })

  it('rejects a token that has already been used once', async () => {
    const codec = makeCodec()
    const token = await codec.mint('marzban_users_delete', { username: 'alice' }, ctx)
    expect(await codec.verify(token, 'marzban_users_delete', { username: 'alice' }, ctx)).toEqual({ ok: true })
    expect(await codec.verify(token, 'marzban_users_delete', { username: 'alice' }, ctx)).toEqual({
      ok: false,
      reason: 'reused',
    })
  })

  it('rejects a token past its TTL', async () => {
    vi.useFakeTimers()
    try {
      const codec = makeCodec()
      const token = await codec.mint('marzban_users_delete', { username: 'alice' }, ctx)
      vi.advanceTimersByTime(301_000)
      const result = await codec.verify(token, 'marzban_users_delete', { username: 'alice' }, ctx)
      expect(result).toEqual({ ok: false, reason: 'malformed' })
    } finally {
      vi.useRealTimers()
    }
  })

  describe('used-token pruning', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('prunes stale entries from the used-token set on a later verify', async () => {
      const codec = makeCodec()

      const tokenA = await codec.mint('marzban_users_delete', { username: 'alice' }, ctx)
      expect(await codec.verify(tokenA, 'marzban_users_delete', { username: 'alice' }, ctx)).toEqual({ ok: true })

      // Past tokenA's used-entry expiry, but a freshly-minted token is still
      // within its own TTL window — this verify call must prune the stale
      // entry rather than reject the fresh token.
      vi.advanceTimersByTime(301_000)
      const tokenB = await codec.mint('marzban_users_delete', { username: 'alice' }, ctx)
      const result = await codec.verify(tokenB, 'marzban_users_delete', { username: 'alice' }, ctx)
      expect(result).toEqual({ ok: true })
    })
  })
})
