import { type Config, createMarzbanSDK, type MarzbanSDK } from 'marzban-sdk'

import type { McpConfig } from '@/config'

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
  }
}

/** Constructs the shared MarzbanSDK instance for this MCP server process. Does not perform any network I/O by itself — see `authenticateOnInit` above. */
export function createSdkClient(config: McpConfig): Promise<MarzbanSDK> {
  return createMarzbanSDK(buildSdkConfig(config))
}
