import { afterEach, describe, expect, it, vi } from 'vitest'

import { getSubtleCrypto, hasNativeWebSocket, isBrowser, isDevEnvironment } from './runtime'

describe('runtime', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  describe('getSubtleCrypto', () => {
    it('returns the global SubtleCrypto when available', () => {
      expect(getSubtleCrypto()).toBe(globalThis.crypto.subtle)
    })

    it('throws when the Web Crypto API is unavailable', () => {
      vi.stubGlobal('crypto', undefined)
      expect(() => getSubtleCrypto()).toThrow(/Web Crypto API/)
    })

    it('throws when crypto exists but subtle is missing', () => {
      vi.stubGlobal('crypto', {})
      expect(() => getSubtleCrypto()).toThrow(/Web Crypto API/)
    })
  })

  describe('hasNativeWebSocket', () => {
    it('returns true when a native WebSocket is on the global scope', () => {
      vi.stubGlobal('WebSocket', class {})
      expect(hasNativeWebSocket()).toBe(true)
    })

    it('returns false when no global WebSocket exists', () => {
      vi.stubGlobal('WebSocket', undefined)
      expect(hasNativeWebSocket()).toBe(false)
    })
  })

  describe('isBrowser', () => {
    it('returns false in a Node-like runtime (no window/document)', () => {
      expect(isBrowser()).toBe(false)
    })

    it('returns true when window and document are present', () => {
      vi.stubGlobal('window', { document: {} })
      expect(isBrowser()).toBe(true)
    })
  })

  describe('isDevEnvironment', () => {
    it('returns true when NODE_ENV is not production', () => {
      vi.stubEnv('NODE_ENV', 'development')
      expect(isDevEnvironment()).toBe(true)
    })

    it('returns false when NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      expect(isDevEnvironment()).toBe(false)
    })

    it('treats an unset NODE_ENV as development', () => {
      vi.stubEnv('NODE_ENV', undefined)
      expect(isDevEnvironment()).toBe(true)
    })

    it('assumes production when process is unavailable', () => {
      vi.stubGlobal('process', undefined)
      expect(isDevEnvironment()).toBe(false)
    })

    it('assumes production when process.env is unavailable', () => {
      vi.stubGlobal('process', {})
      expect(isDevEnvironment()).toBe(false)
    })
  })
})
