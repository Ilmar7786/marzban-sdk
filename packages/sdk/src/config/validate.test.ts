import { describe, expect, it } from 'vitest'

import { ConfigurationError } from '../core/errors'
import { validateConfig } from './validate'

const baseConfig = {
  baseUrl: 'https://api.example.com',
  username: 'user',
  password: 'pass',
}

describe('validateConfig', () => {
  it('returns config with defaults when only required fields are provided', () => {
    const result = validateConfig(baseConfig)

    expect(result).toEqual({
      ...baseConfig,
      timeout: 30_000,
      retries: 3,
      authenticateOnInit: true,
    })
  })

  it('accepts logger false and webhook config', () => {
    const result = validateConfig({
      ...baseConfig,
      logger: false,
      webhook: { secret: 'secret' },
    })

    expect(result.logger).toBe(false)
    expect(result.webhook).toEqual({ secret: 'secret' })
  })

  it('rejects invalid baseUrl', () => {
    expect(() => validateConfig({ ...baseConfig, baseUrl: 'not-a-url' })).toThrow(ConfigurationError)
  })

  it('rejects missing required fields', () => {
    expect(() => validateConfig({ username: 'u' })).toThrow(ConfigurationError)
  })

  it('rejects invalid retries (negative)', () => {
    expect(() => validateConfig({ ...baseConfig, retries: -1 })).toThrow(ConfigurationError)
  })

  it('allows logger objects even if they contain non-function properties (unknown keys are stripped)', () => {
    const result = validateConfig({ ...baseConfig, logger: { debug: 'not-a-fn' } })
    expect(result.logger).toEqual({})
  })

  describe('httpAgent / httpsAgent', () => {
    it('accepts an agent-like object with a destroy method for each field independently', () => {
      const httpAgent = { destroy: () => {} }
      const httpsAgent = { destroy: () => {} }

      expect(validateConfig({ ...baseConfig, httpAgent }).httpAgent).toBe(httpAgent)
      expect(validateConfig({ ...baseConfig, httpsAgent }).httpsAgent).toBe(httpsAgent)
      expect(validateConfig(baseConfig).httpAgent).toBeUndefined()
      expect(validateConfig(baseConfig).httpsAgent).toBeUndefined()
    })

    it('rejects a plain options object mistakenly passed instead of an agent instance', () => {
      expect(() => validateConfig({ ...baseConfig, httpsAgent: { ca: 'not-an-agent' } })).toThrow(ConfigurationError)
    })

    it('rejects non-object values', () => {
      expect(() => validateConfig({ ...baseConfig, httpAgent: 'nope' })).toThrow(ConfigurationError)
      expect(() => validateConfig({ ...baseConfig, httpAgent: null })).toThrow(ConfigurationError)
    })
  })
})
