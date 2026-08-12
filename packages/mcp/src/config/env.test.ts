import { describe, expect, it } from 'vitest'

import { ConfigError, loadConfig, readRawConfigFromEnv } from './env'

function makeEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return { ...overrides } as NodeJS.ProcessEnv
}

describe('readRawConfigFromEnv', () => {
  it('reads every field from the corresponding MARZBAN_* variable', () => {
    const raw = readRawConfigFromEnv(
      makeEnv({
        MARZBAN_BASE_URL: 'https://panel.example.com',
        MARZBAN_USERNAME: 'admin',
        MARZBAN_PASSWORD: 'secret',
        MARZBAN_TOKEN: 'jwt',
        MARZBAN_MCP_PROFILE: 'full',
        MARZBAN_MCP_FORMAT: 'json',
        MARZBAN_MCP_VERBOSITY: 'full',
        MARZBAN_MCP_CONFIRM: 'always',
        MARZBAN_MCP_MAX_CHARS: '4000',
        MARZBAN_MCP_TOOLS_ALLOW: 'users_*, config_get ,templates_*',
        MARZBAN_MCP_TOOLS_DENY: 'config_update',
        MARZBAN_MCP_LOG_LEVEL: 'debug',
        MARZBAN_MCP_SHOW_LINKS: 'true',
      })
    )

    expect(raw).toEqual({
      baseUrl: 'https://panel.example.com',
      username: 'admin',
      password: 'secret',
      token: 'jwt',
      profile: 'full',
      format: 'json',
      verbosity: 'full',
      confirm: 'always',
      maxChars: 4000,
      toolsAllow: ['users_*', 'config_get', 'templates_*'],
      toolsDeny: ['config_update'],
      logLevel: 'debug',
      showLinks: true,
    })
  })

  it('defaults baseUrl to an empty string and leaves the rest undefined when unset', () => {
    const raw = readRawConfigFromEnv(makeEnv())

    expect(raw).toEqual({
      baseUrl: '',
      username: undefined,
      password: undefined,
      token: undefined,
      profile: undefined,
      format: undefined,
      verbosity: undefined,
      confirm: undefined,
      maxChars: undefined,
      toolsAllow: undefined,
      toolsDeny: undefined,
      logLevel: undefined,
      showLinks: undefined,
    })
  })

  it('treats an empty string the same as an unset variable', () => {
    const raw = readRawConfigFromEnv(makeEnv({ MARZBAN_USERNAME: '' }))
    expect(raw.username).toBeUndefined()
  })

  it('produces NaN for a non-numeric MARZBAN_MCP_MAX_CHARS (rejected downstream by the schema)', () => {
    const raw = readRawConfigFromEnv(makeEnv({ MARZBAN_MCP_MAX_CHARS: 'not-a-number' }))
    expect(raw.maxChars).toBeNaN()
  })

  it.each(['1', 'true', 'yes', 'on', 'TRUE', ' On '])('parses %j as boolean true for MARZBAN_MCP_SHOW_LINKS', value => {
    const raw = readRawConfigFromEnv(makeEnv({ MARZBAN_MCP_SHOW_LINKS: value }))
    expect(raw.showLinks).toBe(true)
  })

  it.each(['0', 'false', 'no', 'off', 'FALSE'])('parses %j as boolean false for MARZBAN_MCP_SHOW_LINKS', value => {
    const raw = readRawConfigFromEnv(makeEnv({ MARZBAN_MCP_SHOW_LINKS: value }))
    expect(raw.showLinks).toBe(false)
  })

  it('throws ConfigError for an unrecognized MARZBAN_MCP_SHOW_LINKS spelling', () => {
    expect(() => readRawConfigFromEnv(makeEnv({ MARZBAN_MCP_SHOW_LINKS: 'maybe' }))).toThrow(ConfigError)
  })

  it('drops empty entries and trims whitespace in comma-separated lists', () => {
    const raw = readRawConfigFromEnv(makeEnv({ MARZBAN_MCP_TOOLS_ALLOW: ' users_list ,, users_get ,' }))
    expect(raw.toolsAllow).toEqual(['users_list', 'users_get'])
  })

  it('treats a list of only empty entries as unset', () => {
    const raw = readRawConfigFromEnv(makeEnv({ MARZBAN_MCP_TOOLS_ALLOW: ' , , ' }))
    expect(raw.toolsAllow).toBeUndefined()
  })
})

describe('loadConfig', () => {
  it('returns a validated config for a well-formed environment', () => {
    const config = loadConfig(makeEnv({ MARZBAN_BASE_URL: 'https://panel.example.com', MARZBAN_TOKEN: 'jwt' }))
    expect(config.baseUrl).toBe('https://panel.example.com')
    expect(config.token).toBe('jwt')
    expect(config.profile).toBe('standard')
  })

  it('throws a ConfigError with a human-readable message for an invalid environment', () => {
    expect(() => loadConfig(makeEnv())).toThrow(ConfigError)

    try {
      loadConfig(makeEnv())
      expect.unreachable()
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError)
      const configError = err as ConfigError
      expect(configError.message).toContain('Invalid marzban-mcp configuration')
      expect(configError.message).toContain('baseUrl')
      expect(configError.issues.length).toBeGreaterThan(0)
    }
  })

  it('defaults to process.env when no environment is passed', () => {
    const original = process.env.MARZBAN_BASE_URL
    process.env.MARZBAN_BASE_URL = 'https://panel.example.com'
    process.env.MARZBAN_TOKEN = 'jwt'
    try {
      const config = loadConfig()
      expect(config.baseUrl).toBe('https://panel.example.com')
    } finally {
      if (original === undefined) delete process.env.MARZBAN_BASE_URL
      else process.env.MARZBAN_BASE_URL = original
      delete process.env.MARZBAN_TOKEN
    }
  })
})
