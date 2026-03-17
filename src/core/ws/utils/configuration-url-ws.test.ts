import { describe, expect, it } from 'vitest'

import { configurationUrlWs } from './configuration-url-ws'

const base = {
  basePath: 'https://api.example.com',
  endpoint: '/subscribe',
  token: 'abc123',
  interval: 5000,
}

describe('configurationUrlWs', () => {
  describe('protocol conversion', () => {
    it('converts https to wss', () => {
      const result = configurationUrlWs(base)
      expect(result).toMatch(/^wss:\/\//)
    })

    it('converts http to ws', () => {
      const result = configurationUrlWs({ ...base, basePath: 'http://api.example.com' })
      expect(result).toMatch(/^ws:\/\//)
    })
  })

  describe('endpoint', () => {
    it('sets the pathname to the endpoint', () => {
      const result = configurationUrlWs(base)
      const url = new URL(result)
      expect(url.pathname).toBe('/subscribe')
    })

    it('replaces an existing basePath pathname with the endpoint', () => {
      // basePath has its own path — it gets overwritten
      const result = configurationUrlWs({ ...base, basePath: 'https://api.example.com/v1' })
      const url = new URL(result)
      expect(url.pathname).toBe('/subscribe')
    })
  })

  describe('query params', () => {
    it('sets the interval query param as a string', () => {
      const result = configurationUrlWs(base)
      const url = new URL(result)
      expect(url.searchParams.get('interval')).toBe('5000')
    })

    it('sets the interval when passed as a string', () => {
      const result = configurationUrlWs({ ...base, interval: '10000' })
      const url = new URL(result)
      expect(url.searchParams.get('interval')).toBe('10000')
    })

    it('sets the token query param', () => {
      const result = configurationUrlWs(base)
      const url = new URL(result)
      expect(url.searchParams.get('token')).toBe('abc123')
    })
  })

  describe('host preservation', () => {
    it('preserves the host from basePath', () => {
      const result = configurationUrlWs(base)
      expect(result).toContain('api.example.com')
    })

    it('preserves the port when present in basePath', () => {
      const result = configurationUrlWs({ ...base, basePath: 'https://api.example.com:8080' })
      const url = new URL(result)
      expect(url.port).toBe('8080')
    })
  })

  describe('full output', () => {
    it('returns a valid URL string', () => {
      const result = configurationUrlWs(base)
      expect(() => new URL(result)).not.toThrow()
    })

    it('returns the expected full URL', () => {
      const result = configurationUrlWs(base)
      expect(result).toBe('wss://api.example.com/subscribe?interval=5000&token=abc123')
    })
  })

  describe('invalid input', () => {
    it('throws TypeError for an invalid basePath', () => {
      expect(() => configurationUrlWs({ ...base, basePath: 'not-a-url' })).toThrow(TypeError)
    })
  })
})
