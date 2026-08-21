import { readFileSync } from 'node:fs'
import https from 'node:https'
import path from 'node:path'

import { type Config, createMarzbanSDK, type MarzbanSDK } from 'marzban-sdk'

import { ConfigError, type McpConfig } from '@/config'

/**
 * Builds the `httpsAgent` for `MARZBAN_TLS_CA_FILE`/`MARZBAN_TLS_REJECT_UNAUTHORIZED`.
 * Returns `undefined` when neither is set, so `buildSdkConfig` doesn't touch
 * the SDK's default HTTPS behavior for the common case (a publicly trusted cert).
 */
function buildHttpsAgent(config: McpConfig): https.Agent | undefined {
  if (config.caFile === undefined && config.tlsRejectUnauthorized === undefined) return undefined

  const options: https.AgentOptions = {}

  if (config.caFile !== undefined) {
    // Relative to the process cwd (not this file) — this is what a relative
    // path in an env var means to the operator who set it.
    const absolutePath = path.resolve(process.cwd(), config.caFile)
    try {
      options.ca = readFileSync(absolutePath)
    } catch (err) {
      // fs always throws a real Error (NodeJS.ErrnoException) here, never a
      // non-Error value.
      throw new ConfigError(`Failed to read MARZBAN_TLS_CA_FILE at "${absolutePath}": ${(err as Error).message}`)
    }
  }

  if (config.tlsRejectUnauthorized !== undefined) {
    // From the operator via MARZBAN_TLS_REJECT_UNAUTHORIZED, never a literal
    // `false` written here — this file never disables certificate validation
    // on its own.
    options.rejectUnauthorized = config.tlsRejectUnauthorized
  }

  return new https.Agent(options)
}

export function buildSdkConfig(config: McpConfig): Config {
  return {
    baseUrl: config.baseUrl,
    username: config.username,
    password: config.password,
    token: config.token,
    // Deferred authorization: the process must start (and `tools/list` must
    // respond) even when the panel is unreachable. The first tool call that
    // actually hits the API triggers authentication lazily.
    authenticateOnInit: false,
    logger: { stream: 'stderr', level: config.logLevel },
    httpsAgent: buildHttpsAgent(config),
  }
}

/** Constructs the shared MarzbanSDK instance for this MCP server process. Does not perform any network I/O by itself — see `authenticateOnInit` above. */
export function createSdkClient(config: McpConfig): Promise<MarzbanSDK> {
  return createMarzbanSDK(buildSdkConfig(config))
}
