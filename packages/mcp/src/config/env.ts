import { z } from 'zod'

import { type McpConfig, mcpConfigSchema, type RawMcpConfig } from './config'

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on'])
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off'])

export class ConfigError extends Error {
  constructor(
    message: string,
    readonly issues: z.core.$ZodIssue[] = []
  ) {
    super(message)
    this.name = 'ConfigError'
  }
}

function readString(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]
  return value === undefined || value === '' ? undefined : value
}

function readNumber(env: NodeJS.ProcessEnv, key: string): number | undefined {
  const raw = readString(env, key)
  if (raw === undefined) return undefined
  // An invalid numeric string becomes NaN here and is rejected by the schema
  // (z.number() fails NaN), so it still surfaces as a normal validation issue.
  return Number(raw)
}

function readBoolean(env: NodeJS.ProcessEnv, key: string): boolean | undefined {
  const raw = readString(env, key)
  if (raw === undefined) return undefined
  const normalized = raw.trim().toLowerCase()
  if (TRUE_VALUES.has(normalized)) return true
  if (FALSE_VALUES.has(normalized)) return false
  // Booleans have no schema-level string fallback (the field is z.boolean()),
  // so an unrecognized spelling must fail loudly here — otherwise it would
  // silently resolve to "unset" and default to false.
  throw new ConfigError(
    `Invalid value for ${key}: "${raw}" — expected one of ${[...TRUE_VALUES, ...FALSE_VALUES].join(', ')}.`
  )
}

function readList(env: NodeJS.ProcessEnv, key: string): string[] | undefined {
  const raw = readString(env, key)
  if (raw === undefined) return undefined
  const items = raw
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

/** Reads MCP configuration from `process.env`. Never accepts credentials or `baseUrl` from tool arguments — see plan §6.4. */
export function readRawConfigFromEnv(env: NodeJS.ProcessEnv = process.env): RawMcpConfig {
  return {
    baseUrl: readString(env, 'MARZBAN_BASE_URL') ?? '',
    username: readString(env, 'MARZBAN_USERNAME') ?? '',
    password: readString(env, 'MARZBAN_PASSWORD') ?? '',
    token: readString(env, 'MARZBAN_TOKEN'),
    profile: readString(env, 'MARZBAN_MCP_PROFILE') as RawMcpConfig['profile'],
    format: readString(env, 'MARZBAN_MCP_FORMAT') as RawMcpConfig['format'],
    verbosity: readString(env, 'MARZBAN_MCP_VERBOSITY') as RawMcpConfig['verbosity'],
    confirm: readString(env, 'MARZBAN_MCP_CONFIRM') as RawMcpConfig['confirm'],
    maxChars: readNumber(env, 'MARZBAN_MCP_MAX_CHARS'),
    toolsAllow: readList(env, 'MARZBAN_MCP_TOOLS_ALLOW'),
    toolsDeny: readList(env, 'MARZBAN_MCP_TOOLS_DENY'),
    logLevel: readString(env, 'MARZBAN_MCP_LOG_LEVEL') as RawMcpConfig['logLevel'],
    showLinks: readBoolean(env, 'MARZBAN_MCP_SHOW_LINKS'),
  }
}

function formatIssues(issues: z.core.$ZodIssue[]): string {
  return issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n')
}

/** Reads and validates MCP configuration from `process.env`. @throws {ConfigError} with a human-readable, actionable message. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  const raw = readRawConfigFromEnv(env)
  const result = mcpConfigSchema.safeParse(raw)

  if (!result.success) {
    const issues = result.error.issues
    throw new ConfigError(`Invalid marzban-mcp configuration:\n${formatIssues(issues)}`, issues)
  }

  return result.data
}
