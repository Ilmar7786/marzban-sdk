import { createHash } from 'node:crypto'

/**
 * Deterministic JSON serialization — object keys sorted recursively, so the
 * same logical arguments always hash to the same string regardless of the
 * key order the client (or JSON.stringify) happened to produce.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value))
}

/**
 * SHA-256 of the canonicalized call arguments, minus `confirmToken` — the
 * one field that must never affect the hash, since it carries a fresh `jti`
 * per mint and would otherwise turn every retry into a different key.
 * Shared by the confirm-token binding (`token.ts`) and the `auto` trust
 * cache (`confirm.ts`) so both use exactly the same notion of "same call".
 */
export function hashCallArgs(args: unknown): string {
  const rest: Record<string, unknown> = { ...(args as Record<string, unknown> | undefined) }
  delete rest.confirmToken
  return createHash('sha256').update(canonicalize(rest)).digest('hex')
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}
