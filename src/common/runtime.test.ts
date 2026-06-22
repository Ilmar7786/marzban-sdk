import { afterEach, describe, expect, it, vi } from 'vitest'

import { getSubtleCrypto, hasNativeWebSocket, isBrowser } from './runtime'

describe('runtime', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
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
})
