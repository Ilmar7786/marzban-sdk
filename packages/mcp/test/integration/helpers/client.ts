import { createMarzbanSDK, type MarzbanSDK } from 'marzban-sdk'

import type { McpConfig } from '../../../src/config'
import type { McpLogger } from '../../../src/core/logger'
import type { ToolContext } from '../../../src/core/tool'
import { tlsAgent } from './tls'

/**
 * Defaults match local/marzban/.env.example — a fresh `pnpm local:up` works
 * with zero extra config. Override via env vars to point at a differently
 * configured panel.
 */
function getIntegrationEnv() {
  return {
    baseUrl: process.env.MARZBAN_BASE_URL ?? 'https://127.0.0.1:8000',
    username: process.env.MARZBAN_USERNAME ?? 'admin',
    password: process.env.MARZBAN_PASSWORD ?? 'changeme-local-only',
  }
}

const noopLogger: McpLogger = { debug() {}, info() {}, warn() {}, error() {} }

/**
 * Builds a real `ToolContext` — a real `MarzbanSDK` authenticated against
 * the live panel, not a mock. `confirm: 'always'` so destructive-tool smoke
 * tests always exercise the confirm round-trip, never the 'auto' trust-cache.
 */
export async function createTestToolContext(): Promise<ToolContext> {
  const env = getIntegrationEnv()
  const sdk: MarzbanSDK = await createMarzbanSDK({
    baseUrl: env.baseUrl,
    username: env.username,
    password: env.password,
    httpsAgent: tlsAgent(),
    logger: false,
  })
  const config: McpConfig = {
    baseUrl: env.baseUrl,
    username: env.username,
    password: env.password,
    profile: 'full',
    format: 'text',
    verbosity: 'compact',
    confirm: 'always',
    maxChars: 8000,
    logLevel: 'warn',
    showLinks: false,
  }
  return { sdk, logger: noopLogger, config }
}
