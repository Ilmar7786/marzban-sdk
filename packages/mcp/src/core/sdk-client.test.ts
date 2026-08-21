import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import type { McpConfig } from '@/config'
import { ConfigError } from '@/config'

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

  describe('httpsAgent (MARZBAN_TLS_CA_FILE / MARZBAN_TLS_REJECT_UNAUTHORIZED)', () => {
    let tmpDir: string

    afterEach(() => {
      if (tmpDir) rmSync(tmpDir, { recursive: true, force: true })
    })

    it('leaves httpsAgent undefined when neither caFile nor tlsRejectUnauthorized is set', () => {
      const config = buildSdkConfig(baseConfig)
      expect(config.httpsAgent).toBeUndefined()
    })

    it('builds an httpsAgent that trusts the CA read from caFile', () => {
      tmpDir = mkdtempSync(path.join(tmpdir(), 'marzban-mcp-test-'))
      const caFile = path.join(tmpDir, 'ca.pem')
      writeFileSync(caFile, 'FAKE CA CONTENTS')

      const config = buildSdkConfig({ ...baseConfig, caFile })

      expect(config.httpsAgent).toBeInstanceOf(Object)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const agentOptions = (config.httpsAgent as any).options
      expect(agentOptions.ca.toString()).toBe('FAKE CA CONTENTS')
    })

    it('resolves a relative caFile against process.cwd()', () => {
      tmpDir = mkdtempSync(path.join(tmpdir(), 'marzban-mcp-test-'))
      writeFileSync(path.join(tmpDir, 'ca.pem'), 'FAKE CA CONTENTS')
      const originalCwd = process.cwd()
      process.chdir(tmpDir)

      try {
        const config = buildSdkConfig({ ...baseConfig, caFile: 'ca.pem' })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const agentOptions = (config.httpsAgent as any).options
        expect(agentOptions.ca.toString()).toBe('FAKE CA CONTENTS')
      } finally {
        process.chdir(originalCwd)
      }
    })

    it('throws a ConfigError naming the resolved path when caFile cannot be read', () => {
      const missingPath = path.join(tmpdir(), 'marzban-mcp-test-does-not-exist', 'ca.pem')

      expect(() => buildSdkConfig({ ...baseConfig, caFile: missingPath })).toThrow(ConfigError)
      try {
        buildSdkConfig({ ...baseConfig, caFile: missingPath })
        expect.unreachable()
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigError)
        expect((err as ConfigError).message).toContain(missingPath)
        expect((err as ConfigError).message).toContain('MARZBAN_TLS_CA_FILE')
      }
    })

    it('applies tlsRejectUnauthorized to the agent even without a caFile', () => {
      const config = buildSdkConfig({ ...baseConfig, tlsRejectUnauthorized: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const agentOptions = (config.httpsAgent as any).options
      expect(agentOptions.rejectUnauthorized).toBe(false)
    })

    it('combines caFile and tlsRejectUnauthorized on the same agent', () => {
      tmpDir = mkdtempSync(path.join(tmpdir(), 'marzban-mcp-test-'))
      const caFile = path.join(tmpDir, 'ca.pem')
      writeFileSync(caFile, 'FAKE CA CONTENTS')

      const config = buildSdkConfig({ ...baseConfig, caFile, tlsRejectUnauthorized: true })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const agentOptions = (config.httpsAgent as any).options
      expect(agentOptions.ca.toString()).toBe('FAKE CA CONTENTS')
      expect(agentOptions.rejectUnauthorized).toBe(true)
    })
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
