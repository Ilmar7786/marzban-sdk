import type { CallToolResult, McpServer, ServerContext, ToolAnnotations } from '@modelcontextprotocol/server'
import type { z } from 'zod'

import type { McpConfig } from '@/config'
import { render } from '@/format/render'

import { toToolError } from '../errors'
import type { ToolContext } from './context'
import type { ToolDefinition, ToolScope } from './define-tool'

const PROFILE_SCOPES: Record<McpConfig['profile'], ReadonlySet<ToolScope>> = {
  readonly: new Set(['read']),
  standard: new Set(['read', 'write']),
  full: new Set(['read', 'write', 'destructive']),
}

export interface ConfirmDecision {
  proceed: boolean
  /** Shown to the model instead of running the tool when `proceed` is false. */
  message?: string
  /**
   * Why the call was allowed. `'token'` means a fresh, single-use confirm
   * token was just verified — a human re-approved this exact operation
   * moments ago, which is the one signal allowed to override a recorded
   * outcome in `core/idempotency`. Optional: a `ConfirmFn` that doesn't
   * distinguish its reasons (`alwaysProceed`) simply omits it.
   */
  reason?: 'off' | 'trusted' | 'token'
}

export type ConfirmFn = (input: {
  tool: ToolDefinition<z.ZodType, z.ZodType>
  args: unknown
  ctx: ToolContext
  serverCtx: ServerContext
}) => ConfirmDecision | Promise<ConfirmDecision>

/**
 * A `ConfirmFn` that never asks. `createMarzbanMcpServer` uses the real
 * strategy from `core/confirm` instead — this is for tests that need a
 * `ConfirmFn` but aren't exercising confirmation itself.
 */
export const alwaysProceed: ConfirmFn = () => ({ proceed: true })

export type DedupOutcome =
  /** The handler ran for this call. */
  | { kind: 'executed'; data: unknown }
  /** An identical call already ran; `data` is what it returned, `notice` says so, and nothing was sent to the panel. */
  | { kind: 'replayed'; data: unknown; notice: string }
  /** An identical call was interrupted before anyone saw its outcome; `message` steers the model to verify. */
  | { kind: 'unknown'; message: string }

export type DedupFn = (input: {
  tool: ToolDefinition<z.ZodType, z.ZodType>
  args: unknown
  ctx: ToolContext
  /** Run this operation anyway, discarding any recorded outcome — set when a fresh confirm token was just verified. */
  bypass: boolean
  run: () => Promise<unknown>
}) => Promise<DedupOutcome>

/**
 * A `DedupFn` that remembers nothing and always runs the handler. The
 * counterpart to `alwaysProceed`: `createMarzbanMcpServer` uses the real store
 * from `core/idempotency`, this is for tests that aren't exercising dedup.
 */
export const alwaysExecute: DedupFn = async ({ run }) => ({ kind: 'executed', data: await run() })

function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`)
}

function matchesAny(name: string, patterns: readonly string[] | undefined): boolean {
  if (!patterns || patterns.length === 0) return false
  return patterns.some(pattern => globToRegExp(pattern).test(name))
}

export interface SelectToolsOptions {
  profile: McpConfig['profile']
  toolsAllow?: readonly string[]
  toolsDeny?: readonly string[]
}

/**
 * Applies the profile scope gate, then deny (always wins), then allow
 * (narrows further when set), and sorts by name — `tools/list` order must
 * never depend on module registration order (plan §5).
 */
export function selectTools(
  tools: readonly ToolDefinition<z.ZodType, z.ZodType>[],
  options: SelectToolsOptions
): ToolDefinition<z.ZodType, z.ZodType>[] {
  const allowedScopes = PROFILE_SCOPES[options.profile]
  return tools
    .filter(tool => allowedScopes.has(tool.scope))
    .filter(tool => !matchesAny(tool.name, options.toolsDeny))
    .filter(tool => !options.toolsAllow || matchesAny(tool.name, options.toolsAllow))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
}

function deriveAnnotations(tool: ToolDefinition<z.ZodType, z.ZodType>): ToolAnnotations {
  return {
    title: tool.title,
    // Derived from `scope`, never author-settable — see the contract note in
    // define-tool.ts on why that's the point.
    readOnlyHint: tool.scope === 'read',
    destructiveHint: tool.scope === 'destructive',
    ...tool.annotations,
  }
}

export interface RegisterToolsOptions {
  server: McpServer
  tools: readonly ToolDefinition<z.ZodType, z.ZodType>[]
  ctx: ToolContext
  confirm: ConfirmFn
  dedup: DedupFn
}

/**
 * Puts the "this already ran" notice in front of the rendered result, as its
 * own content block. `content` is free-form even for a tool that declares an
 * `outputSchema` — only `structuredContent` is schema-bound, and it stays
 * exactly as recorded, so the replay is honest to a program and legible to a
 * model. Without the notice the model would report a replay as a fresh
 * execution, which is the one failure mode a safety feature must not have.
 *
 * The notice sits outside the `maxChars` budget `render` already applied:
 * going a couple of hundred characters over is better than truncating the
 * warning itself.
 */
function withReplayNotice(result: CallToolResult, notice: string): CallToolResult {
  return { ...result, content: [{ type: 'text', text: notice }, ...result.content] }
}

/**
 * Registers the profile/allow/deny-filtered subset of `tools` on `server`.
 * Every registered handler goes through the same pipeline: confirm (only for
 * `destructive` scope) → call the module's handler → render per
 * format/verbosity → map any thrown error to `CallToolResult{isError:true}`.
 * Module handlers return plain data — they never see `CallToolResult`, only
 * `registry`/`render` do.
 *
 * Returns the tools that were actually registered, for tests and startup
 * diagnostics.
 */
export function registerTools(options: RegisterToolsOptions): ToolDefinition<z.ZodType, z.ZodType>[] {
  const { server, tools, ctx, confirm, dedup } = options
  const selected = selectTools(tools, {
    profile: ctx.config.profile,
    toolsAllow: ctx.config.toolsAllow,
    toolsDeny: ctx.config.toolsDeny,
  })
  // Config is read once at startup and fixed for the process, so these are
  // the same for every call and every tool.
  const renderOptions = {
    format: ctx.config.format,
    verbosity: ctx.config.verbosity,
    maxChars: ctx.config.maxChars,
    showLinks: ctx.config.showLinks,
  }

  for (const tool of selected) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        annotations: deriveAnnotations(tool),
      },
      async (args: unknown, serverCtx: ServerContext): Promise<CallToolResult> => {
        try {
          // One evaluation of `skipConfirm` for both guarded stages: it is
          // author-supplied and need not be pure, and a dry run must reach
          // neither of them.
          const guarded = tool.scope === 'destructive' && !(tool.skipConfirm?.(args, ctx) ?? false)
          if (!guarded) return render(await tool.handler(args, ctx), tool.view, renderOptions)

          const decision = await confirm({ tool, args, ctx, serverCtx })
          if (!decision.proceed) {
            // isError: true, not false — every destructive tool declares
            // an outputSchema, and the SDK requires structuredContent on
            // every non-error result that has one (it has no bearing on
            // this tool's actual output shape, so there's nothing honest
            // to put there). The model still reads `content` either way.
            return {
              content: [{ type: 'text', text: decision.message ?? 'Confirmation required.' }],
              isError: true,
            }
          }

          // Confirmation first, dedup second: the key deliberately ignores
          // `confirmToken`, so a caller presenting no token hashes to the
          // same key as the confirmed original. Deduping first would hand
          // that caller the recorded result — for `marzban_config_update`,
          // the entire previous core config — past the gate.
          const outcome = await dedup({
            tool,
            args,
            ctx,
            bypass: decision.reason === 'token',
            run: () => tool.handler(args, ctx),
          })

          // isError for the same reason the decline branch above is: there
          // is no honest structuredContent for an outcome nobody observed.
          if (outcome.kind === 'unknown') {
            return { content: [{ type: 'text', text: outcome.message }], isError: true }
          }

          const result = render(outcome.data, tool.view, renderOptions)
          return outcome.kind === 'replayed' ? withReplayNotice(result, outcome.notice) : result
        } catch (err) {
          return toToolError(err)
        }
      }
    )
  }

  return selected
}
