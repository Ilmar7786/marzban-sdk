import { describe, expect, it } from 'vitest'

import type { AnyType } from '@/common'

import { extractWsHandshakeStatus, getWsErrorMessage } from './ws-error'

describe('getWsErrorMessage', () => {
  it('returns the message property when present', () => {
    expect(getWsErrorMessage({ message: '403 Forbidden' } as AnyType)).toBe('403 Forbidden')
  })

  it('returns an empty string when no message property is present', () => {
    expect(getWsErrorMessage({} as AnyType)).toBe('')
  })
})

describe('extractWsHandshakeStatus', () => {
  it("reads the status out of the ws package's rejected-handshake message", () => {
    expect(extractWsHandshakeStatus('Unexpected server response: 403')).toBe(403)
  })

  it.each([401, 404, 500])('reads status %s', status => {
    expect(extractWsHandshakeStatus(`Unexpected server response: ${status}`)).toBe(status)
  })

  it('is case-insensitive and tolerates extra spacing', () => {
    expect(extractWsHandshakeStatus('unexpected server response:  502')).toBe(502)
  })

  // The whole point of anchoring to the phrase: a refused connection carries a
  // port number, and reading that as a status would turn "the panel is
  // restarting" into "the panel rejected us" — terminating a stream that
  // should have kept reconnecting.
  it('does not mistake the port in a connection-refused message for a status', () => {
    expect(extractWsHandshakeStatus('connect ECONNREFUSED 127.0.0.1:53467')).toBeUndefined()
  })

  it('returns undefined for the native transport, which reports no message at all', () => {
    expect(extractWsHandshakeStatus('')).toBeUndefined()
  })

  it('returns undefined for an unrelated error message that happens to contain digits', () => {
    expect(extractWsHandshakeStatus('getaddrinfo ENOTFOUND panel.example.com 443')).toBeUndefined()
  })
})
