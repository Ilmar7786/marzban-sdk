import { z } from 'zod'

import {
  DEFAULT_CONFIRM,
  DEFAULT_FORMAT,
  DEFAULT_LOG_LEVEL,
  DEFAULT_MAX_CHARS,
  DEFAULT_PROFILE,
  DEFAULT_SHOW_LINKS,
  DEFAULT_VERBOSITY,
} from './defaults'

// Marzban's session tokens are short-lived by default and the panel has no
// separate long-lived API-key mechanism for external systems — the only way
// to get a token is a username/password login, and the only way to keep the
// MCP server working past the token's TTL is to let the SDK re-authenticate
// on 401. So, unlike a typical REST API client, credential-less "just give it
// a token" operation is not viable here: username/password are mandatory.
// `token` is still accepted as an optional startup optimization — it lets
// the SDK skip the very first login call if a still-fresh token is already
// on hand — but it is never a substitute for the password.
export const mcpConfigSchema = z.object({
  baseUrl: z.url(),
  username: z.string().min(1),
  password: z.string().min(1),
  token: z.string().min(1).optional(),
  profile: z.enum(['readonly', 'standard', 'full']).default(DEFAULT_PROFILE),
  format: z.enum(['text', 'table', 'json']).default(DEFAULT_FORMAT),
  verbosity: z.enum(['compact', 'full']).default(DEFAULT_VERBOSITY),
  confirm: z.enum(['auto', 'always', 'off']).default(DEFAULT_CONFIRM),
  maxChars: z.number().int().positive().default(DEFAULT_MAX_CHARS),
  toolsAllow: z.array(z.string().min(1)).optional(),
  toolsDeny: z.array(z.string().min(1)).optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default(DEFAULT_LOG_LEVEL),
  showLinks: z.boolean().default(DEFAULT_SHOW_LINKS),
  // Covers the common self-hosted-Marzban case: a panel behind a self-signed
  // or internal-CA certificate. Trusts one extra CA rather than disabling
  // verification — see buildSdkConfig in core/sdk-client.ts.
  caFile: z.string().min(1).optional(),
  // Escape hatch for panels the operator cannot get a trusted/known CA for.
  // Deliberately not exposed as a generic "insecure" toggle — the env var
  // name spells out exactly what it disables.
  tlsRejectUnauthorized: z.boolean().optional(),
})

export type McpConfig = z.infer<typeof mcpConfigSchema>
export type RawMcpConfig = z.input<typeof mcpConfigSchema>
