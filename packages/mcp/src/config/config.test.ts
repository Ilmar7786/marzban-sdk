import { describe, expect, it } from 'vitest'

import { mcpConfigSchema } from './config'

const baseUrl = 'https://panel.example.com'
const creds = { username: 'admin', password: 'secret' }

describe('mcpConfigSchema', () => {
  it('accepts username+password credentials', () => {
    const result = mcpConfigSchema.safeParse({ baseUrl, ...creds })
    expect(result.success).toBe(true)
  })

  it('accepts username+password combined with an optional token', () => {
    const result = mcpConfigSchema.safeParse({ baseUrl, ...creds, token: 'jwt' })
    expect(result.success).toBe(true)
  })

  it('rejects a token without username+password — Marzban tokens are short-lived and cannot be refreshed without a password', () => {
    const result = mcpConfigSchema.safeParse({ baseUrl, token: 'jwt-token' })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toContainEqual(expect.objectContaining({ path: ['username'] }))
    expect(result.error?.issues).toContainEqual(expect.objectContaining({ path: ['password'] }))
  })

  it('rejects a config with no credentials at all', () => {
    const result = mcpConfigSchema.safeParse({ baseUrl })
    expect(result.success).toBe(false)
  })

  it('rejects username without password', () => {
    const result = mcpConfigSchema.safeParse({ baseUrl, username: 'admin' })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toContainEqual(expect.objectContaining({ path: ['password'] }))
  })

  it('rejects password without username', () => {
    const result = mcpConfigSchema.safeParse({ baseUrl, password: 'secret' })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toContainEqual(expect.objectContaining({ path: ['username'] }))
  })

  it('rejects an invalid baseUrl', () => {
    const result = mcpConfigSchema.safeParse({ baseUrl: 'not-a-url', ...creds })
    expect(result.success).toBe(false)
  })

  it('applies defaults for every optional field', () => {
    const result = mcpConfigSchema.parse({ baseUrl, ...creds })
    expect(result).toMatchObject({
      profile: 'standard',
      format: 'text',
      verbosity: 'compact',
      confirm: 'auto',
      maxChars: 8000,
      logLevel: 'warn',
      showLinks: false,
    })
  })

  it('rejects unknown enum values', () => {
    const result = mcpConfigSchema.safeParse({ baseUrl, ...creds, profile: 'god-mode' })
    expect(result.success).toBe(false)
  })

  it('accepts explicit overrides for every field', () => {
    const result = mcpConfigSchema.parse({
      baseUrl,
      ...creds,
      token: 'jwt',
      profile: 'full',
      format: 'json',
      verbosity: 'full',
      confirm: 'off',
      maxChars: 1000,
      toolsAllow: ['users_*'],
      toolsDeny: ['config_update'],
      logLevel: 'debug',
      showLinks: true,
    })
    expect(result).toMatchObject({
      profile: 'full',
      format: 'json',
      verbosity: 'full',
      confirm: 'off',
      maxChars: 1000,
      toolsAllow: ['users_*'],
      toolsDeny: ['config_update'],
      logLevel: 'debug',
      showLinks: true,
    })
  })
})
