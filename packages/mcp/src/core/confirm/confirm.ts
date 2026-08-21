import type { ConfirmDecision, ConfirmFn } from '../tool'
import { CONFIRM_TOKEN_TTL_SECONDS, createConfirmTokenCodec } from './token'

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
 * Builds the real confirm strategy (plan §6.1–§6.2, confirm_token branch
 * only — native MRTR elicitation is left for a later iteration, see the
 * step-5 commit message for why). One instance owns one signing key and one
 * `trustedTools` set, both scoped to the server instance's lifetime — a
 * fresh `createMarzbanMcpServer()` call (i.e. a restart) starts over, which
 * is the intended behavior (plan §6.1/§6.6).
 */
export function createConfirmFn(): ConfirmFn {
  const codec = createConfirmTokenCodec(crypto.getRandomValues(new Uint8Array(32)))
  const trustedTools = new Set<string>()

  return async function confirm({ tool, args, ctx, serverCtx }): Promise<ConfirmDecision> {
    if (ctx.config.confirm === 'off') return { proceed: true }

    if (ctx.config.confirm === 'auto' && trustedTools.has(tool.name)) {
      return { proceed: true }
    }

    const token = extractConfirmToken(args)
    if (token) {
      const result = await codec.verify(token, tool.name, args, serverCtx)
      if (result.ok) {
        if (ctx.config.confirm === 'auto') trustedTools.add(tool.name)
        return { proceed: true }
      }
      ctx.logger.warn(`Rejected confirmToken for ${tool.name}: ${result.reason}`)
    }

    const consequences = await describeConsequences(tool, args, ctx)
    const newToken = await codec.mint(tool.name, args, serverCtx)
    return { proceed: false, message: buildConfirmationMessage(consequences, newToken) }
  }
}
