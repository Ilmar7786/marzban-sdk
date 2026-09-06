import { createTtlMap } from '@/shared/ttl-map'

import type { ConfirmDecision, ConfirmFn } from '../tool'
import { callKey } from './canonical'
import { CONFIRM_TOKEN_TTL_SECONDS, type ConfirmVerifyResult, createConfirmTokenCodec } from './token'

type RejectionReason = Extract<ConfirmVerifyResult, { ok: false }>['reason']

function extractConfirmToken(args: unknown): string | undefined {
  if (!args || typeof args !== 'object' || !('confirmToken' in args)) return undefined
  const value = (args as { confirmToken?: unknown }).confirmToken
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

async function describeConsequences(
  tool: Parameters<ConfirmFn>[0]['tool'],
  args: unknown,
  ctx: Parameters<ConfirmFn>[0]['ctx']
): Promise<string> {
  if (!tool.describeConsequences) {
    return `This will run "${tool.title}" (${tool.name}), a destructive and irreversible operation.`
  }
  return tool.describeConsequences(args, ctx)
}

function buildConfirmationMessage(consequences: string, token: string): string {
  return [
    consequences,
    'This cannot be undone automatically.',
    `Do not call this tool again until the user has explicitly said yes. Once they have, repeat the exact same call with confirmToken: "${token}" added.`,
    `The token is only valid for this tool and these exact arguments, and expires in ${Math.round(CONFIRM_TOKEN_TTL_SECONDS / 60)} minutes.`,
  ].join(' ')
}

/**
 * Carried on a `trusted` decision so the registry can append it to a replay
 * notice: a call that proceeds on accumulated trust never reaches the branch
 * that mints a token, so without this the notice's own "confirm it afresh"
 * advice is impossible to follow in `auto` (issue #129, ADR-0020).
 */
function buildRerunHint(token: string): string {
  return [
    'Do not call this tool again until the user has explicitly said yes.',
    `Once they have, repeat the exact same call with confirmToken: "${token}" to run it for real.`,
  ].join(' ')
}

/**
 * Builds the real confirm strategy (plan §6.1–§6.2, confirm_token branch
 * only — native MRTR elicitation is left for a later iteration, see the
 * step-5 commit message for why). One instance owns one signing key and one
 * `trustedCalls` map, both scoped to the server instance's lifetime — a
 * fresh `createMarzbanMcpServer()` call (i.e. a restart) starts over, which
 * is the intended behavior (plan §6.1/§6.6).
 *
 * `trustedCalls` keys trust by tool name *and* the exact call arguments
 * (see issue #74) — confirming `marzban_users_delete` for "alice" must not
 * silently authorise deleting "bob", or resetting *every* user's traffic
 * once `{ username }` was confirmed. Each entry also carries the same TTL as
 * a confirm token (`CONFIRM_TOKEN_TTL_SECONDS`): without an expiry, a tool
 * whose arguments never vary (`marzban_core_restart` always takes `{}`)
 * would get an unlimited number of free re-runs from a single confirmation.
 *
 * A presented token is checked *before* that cache (issue #129, ADR-0020),
 * and a trusted decision carries a fresh one for the registry to hand back
 * with a replay notice — together those make a deliberate second run of the
 * same call expressible in `auto` instead of only in `always`.
 */
export function createConfirmFn(): ConfirmFn {
  const codec = createConfirmTokenCodec(crypto.getRandomValues(new Uint8Array(32)))
  const trustedCalls = createTtlMap<true>()

  return async function confirm({ tool, args, ctx, serverCtx }): Promise<ConfirmDecision> {
    if (ctx.config.confirm === 'off') return { proceed: true, reason: 'off' }

    const key = callKey(tool.name, args)

    const token = extractConfirmToken(args)
    let rejection: RejectionReason | undefined
    if (token) {
      const result = await codec.verify(token, tool.name, args, serverCtx)
      if (result.ok) {
        if (ctx.config.confirm === 'auto') {
          trustedCalls.set(key, true, CONFIRM_TOKEN_TTL_SECONDS * 1000)
        }
        // `token` and not `trusted`: a single-use token verified just now is
        // a human saying yes to this operation a moment ago, which is what
        // lets `core/idempotency` run it again rather than replay a recorded
        // outcome. An accidental retry never lands here — it re-sends the
        // consumed token, which fails verification as `reused`.
        return { proceed: true, reason: 'token' }
      }
      rejection = result.reason
    }

    if (ctx.config.confirm === 'auto' && trustedCalls.get(key) !== undefined) {
      // An honest retry re-sends its already-consumed token and lands here
      // with `rejection: 'reused'`. That is the normal case, not a problem,
      // so it is reported alongside the trust it proceeds on rather than as
      // a warning — the `warn` below is for a call that is actually refused.
      const rejected = rejection ? ` (its confirmToken was rejected as ${rejection})` : ''
      ctx.logger.info(
        `Proceeding on accumulated confirm trust for ${tool.name}${rejected} (same call, still within TTL).`
      )
      const rerunToken = await codec.mint(tool.name, args, serverCtx)
      return { proceed: true, reason: 'trusted', rerunHint: buildRerunHint(rerunToken) }
    }

    if (rejection) ctx.logger.warn(`Rejected confirmToken for ${tool.name}: ${rejection}`)

    const consequences = await describeConsequences(tool, args, ctx)
    const newToken = await codec.mint(tool.name, args, serverCtx)
    return { proceed: false, message: buildConfirmationMessage(consequences, newToken) }
  }
}
