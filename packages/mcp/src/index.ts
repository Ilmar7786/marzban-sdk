import { createRequire } from 'node:module'

import { serveStdio } from '@modelcontextprotocol/server/stdio'

import { ConfigError, loadConfig, type McpConfig } from '@/config'
import { createStderrLogger } from '@/core/logger'
import { createSdkClient } from '@/core/sdk-client'
import type { ToolContext } from '@/core/tool'
import { createMarzbanMcpServer } from '@/server'

const require = createRequire(import.meta.url)
const { name, version } = require('../package.json') as { name: string; version: string }

async function main(): Promise<void> {
  let config: McpConfig
  try {
    config = loadConfig()
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(err.message)
      process.exit(1)
    }
    throw err
  }

  if (config.confirm === 'off') {
    console.error(
      `[${name}] confirmation disabled (MARZBAN_MCP_CONFIRM=off) — destructive tools execute without confirmation`
    )
  }

  const sdk = await createSdkClient(config)
  const logger = createStderrLogger(config.logLevel)
  const ctx: ToolContext = { sdk, logger, config }

  const handle = serveStdio(() => createMarzbanMcpServer({ name, version }, ctx), {
    onerror: error => {
      console.error(`[${name}] transport error: ${error.message}`)
    },
  })

  let shuttingDown = false
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    console.error(`[${name}] received ${signal}, shutting down`)
    await handle.close()
    await sdk.destroy()
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

main().catch((err: unknown) => {
  console.error(`[${name}] fatal error during startup:`, err)
  process.exit(1)
})
