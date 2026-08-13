import { type ProxyHost, varValidate } from 'marzban-sdk'

export interface CoreConfigSummary {
  inbounds: Array<{ tag: string | null; port: number | string | null; protocol: string | null }>
  outbounds: Array<{ tag: string | null; protocol: string | null }>
  routingRulesCount: number | null
  otherTopLevelKeys: string[]
}

const KNOWN_TOP_LEVEL_KEYS = new Set(['log', 'inbounds', 'outbounds', 'routing'])

function pickString(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== 'object') return null
  const value = (obj as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}

function pickPort(obj: unknown): number | string | null {
  if (!obj || typeof obj !== 'object') return null
  const value = (obj as Record<string, unknown>).port
  return typeof value === 'number' || typeof value === 'string' ? value : null
}

/**
 * Xray's core config is arbitrary, un-typed JSON (plan §0/§2 — the OpenAPI
 * spec itself declares it as `type: object` with no properties) — this stays
 * defensive about shapes rather than assuming any of it is present.
 * Structural summary for `marzban_config_get`'s default mode (plan §5): a
 * multi-megabyte config must not need a full dump to answer "what inbounds
 * does this have".
 */
export function summarizeCoreConfig(config: Record<string, unknown>): CoreConfigSummary {
  const inbounds = Array.isArray(config.inbounds) ? config.inbounds : []
  const outbounds = Array.isArray(config.outbounds) ? config.outbounds : []
  const routing = config.routing
  const rules = routing && typeof routing === 'object' ? (routing as Record<string, unknown>).rules : undefined

  return {
    inbounds: inbounds.map(entry => ({
      tag: pickString(entry, 'tag'),
      port: pickPort(entry),
      protocol: pickString(entry, 'protocol'),
    })),
    outbounds: outbounds.map(entry => ({
      tag: pickString(entry, 'tag'),
      protocol: pickString(entry, 'protocol'),
    })),
    routingRulesCount: Array.isArray(rules) ? rules.length : null,
    otherTopLevelKeys: Object.keys(config)
      .filter(key => !KNOWN_TOP_LEVEL_KEYS.has(key))
      .sort(),
  }
}

export interface KeyDiff {
  addedKeys: string[]
  removedKeys: string[]
  changedKeys: string[]
}

/**
 * Shallow top-level-key diff — the honest scope for arbitrary, un-typed JSON
 * (a full deep diff would need to understand Xray's schema, which we
 * deliberately don't). Good enough to answer "what sections changed" for a
 * confirmation prompt or a `dry_run` preview.
 */
export function diffTopLevelKeys(before: Record<string, unknown>, after: Record<string, unknown>): KeyDiff {
  const beforeKeys = new Set(Object.keys(before))
  const afterKeys = new Set(Object.keys(after))

  return {
    addedKeys: [...afterKeys].filter(key => !beforeKeys.has(key)).sort(),
    removedKeys: [...beforeKeys].filter(key => !afterKeys.has(key)).sort(),
    changedKeys: [...afterKeys]
      .filter(key => beforeKeys.has(key) && JSON.stringify(before[key]) !== JSON.stringify(after[key]))
      .sort(),
  }
}

export interface HostVariableWarning {
  inboundTag: string
  index: number
  field: 'remark' | 'address' | 'host' | 'sni' | 'path'
  unknownVariables: string[]
}

const TEMPLATE_FIELDS = ['remark', 'address', 'host', 'sni', 'path'] as const

/**
 * Surfaces host-setting fields that reference an unknown `{VARIABLE}` —
 * almost always a typo, since Marzban silently leaves unknown tokens
 * un-substituted in the generated link/config (plan §7: "getHosts +
 * валидация шаблонных переменных").
 */
export function validateHostTemplates(hosts: Record<string, ProxyHost[]>): HostVariableWarning[] {
  const warnings: HostVariableWarning[] = []

  for (const [inboundTag, list] of Object.entries(hosts)) {
    list.forEach((host, index) => {
      for (const field of TEMPLATE_FIELDS) {
        const value = host[field]
        if (typeof value !== 'string' || !value) continue
        const result = varValidate(value)
        if (!result.isValid) warnings.push({ inboundTag, index, field, unknownVariables: result.unknownVariables })
      }
    })
  }

  return warnings
}
