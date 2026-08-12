import { describe, expect, it } from 'vitest'

import type { McpConfig } from '@/config'

import { buildSdkConfig, createSdkClient } from './sdk-client'

const baseConfig: McpConfig = {
  baseUrl: 'https://panel.example.com',
  username: 'admin',
  password: 'secret',
  profile: 'standard',
  format: 'text',
  verbosity: 'compact',
  confirm: 'auto',
  maxChars: 8000,
  logLevel: 'warn',
  showLinks: false,
}

describe('buildSdkConfig', () => {
  it('passes through the configured username/password', () => {
    const config = buildSdkConfig(baseConfig)
    expect(config.username).toBe('admin')
    expect(config.password).toBe('secret')
    expect(config.token).toBeUndefined()
  })

  it('passes through an optional token alongside the required credentials', () => {
    const config = buildSdkConfig({ ...baseConfig, token: 'jwt' })
    expect(config.token).toBe('jwt')
    expect(config.username).toBe('admin')
    expect(config.password).toBe('secret')
  })

  it('always defers authorization to the first tool call', () => {
    const config = buildSdkConfig(baseConfig)
    expect(config.authenticateOnInit).toBe(false)
  })

  it('routes the configured log level to a stderr-bound logger', () => {
    const config = buildSdkConfig({ ...baseConfig, logLevel: 'debug' })
    expect(config.logger).toEqual({ stream: 'stderr', level: 'debug' })
  })
})

describe('createSdkClient', () => {
  it('constructs an SDK instance without making any network calls', async () => {
    const sdk = await createSdkClient(baseConfig)
    expect(sdk.user).toBeDefined()
    expect(sdk.core).toBeDefined()
    await sdk.destroy()
  })
})
