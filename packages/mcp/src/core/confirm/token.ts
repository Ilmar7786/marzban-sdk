import { createHash, randomUUID } from 'node:crypto'

import { createRequestStateCodec, type ServerContext } from '@modelcontextprotocol/server'

import { canonicalize } from './canonical'

/** How long a minted confirm_token stays valid (plan §6.1). */
export const CONFIRM_TOKEN_TTL_SECONDS = 300

interface ConfirmPayload {
  /** Random id — makes the token single-use once recorded in `usedJti`. */
  jti: string
  /** The exact tool this token was minted for; rejected if replayed against another. */
  tool: string
  /** SHA-256 of the canonicalized call arguments (minus `confirmToken` itself). */
  argsHash: string
}

export type ConfirmVerifyResult =
  { ok: true } | { ok: false; reason: 'malformed' | 'tool-mismatch' | 'args-mismatch' | 'reused' }

export interface ConfirmTokenCodec {
  mint(tool: string, args: unknown, ctx: ServerContext): Promise<string>
  verify(token: string, tool: string, args: unknown, ctx: ServerContext): Promise<ConfirmVerifyResult>
}

function hashArgs(args: unknown): string {
  const rest: Record<string, unknown> = { ...(args as Record<string, unknown> | undefined) }
  delete rest.confirmToken
  return createHash('sha256').update(canonicalize(rest)).digest('hex')
}

/**
 * Wraps `createRequestStateCodec` (the SDK's signed, TTL'd request-state
 * primitive — see plan §6.1) with the extra checks a confirmation token
 * needs on top of "not tampered with": bound to one specific tool, bound to
 * the exact arguments being retried, and single-use.
 *
 * `usedJti` lives only in process memory, same lifecycle as the codec's key
 * — both are gone on restart, which is the desired behavior (plan §6.1: a
 * restarted server should not honor confirmations minted by a previous run).
 */
export function createConfirmTokenCodec(key: Uint8Array): ConfirmTokenCodec {
  const codec = createRequestStateCodec<ConfirmPayload>({ key, ttlSeconds: CONFIRM_TOKEN_TTL_SECONDS })
  const usedJti = new Map<string, number>()

  function pruneExpired(now: number): void {
    for (const [jti, expiresAt] of usedJti) {
      if (expiresAt <= now) usedJti.delete(jti)
    }
  }

  return {
    async mint(tool, args, ctx) {
      return codec.mint({ jti: randomUUID(), tool, argsHash: hashArgs(args) }, ctx)
    },

    async verify(token, tool, args, ctx) {
      let payload: ConfirmPayload
      try {
        payload = await codec.verify(token, ctx)
      } catch {
        return { ok: false, reason: 'malformed' }
      }

      if (payload.tool !== tool) return { ok: false, reason: 'tool-mismatch' }
      if (payload.argsHash !== hashArgs(args)) return { ok: false, reason: 'args-mismatch' }

      const now = Date.now()
      pruneExpired(now)
      if (usedJti.has(payload.jti)) return { ok: false, reason: 'reused' }
      usedJti.set(payload.jti, now + CONFIRM_TOKEN_TTL_SECONDS * 1000)

      return { ok: true }
    },
  }
}
