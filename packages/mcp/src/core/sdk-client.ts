import { type Config, createMarzbanSDK, type MarzbanSDK } from 'marzban-sdk'

import type { McpConfig } from '@/config'

// marzban-sdk's own config schema still requires non-empty username/password
// even when a token is supplied (tracked as a follow-up in the SDK). These
// placeholders are never sent over the wire during normal operation — the
// SDK reads a pre-supplied token straight off storage without authenticating
// — and only surface if the token expires and the SDK attempts a reauth, at
// which point they fail visibly (401) instead of silently reusing whatever
// credentials happen to be configured.
const TOKEN_ONLY_USERNAME = '__marzban_mcp_token_only__'
const TOKEN_ONLY_PASSWORD = '__marzban_mcp_token_only__'

export function buildSdkConfig(config: McpConfig): Config {
  return {
    baseUrl: config.baseUrl,
    username: config.username ?? TOKEN_ONLY_USERNAME,
    password: config.password ?? TOKEN_ONLY_PASSWORD,
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
