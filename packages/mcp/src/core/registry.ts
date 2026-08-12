import type { CallToolResult, McpServer, ServerContext, ToolAnnotations } from '@modelcontextprotocol/server'
import type { z } from 'zod'

import type { McpConfig } from '@/config'
import { render } from '@/format/render'

import type { ToolContext } from './context'
import type { ToolDefinition, ToolScope } from './define-tool'
import { toToolError } from './errors'

const PROFILE_SCOPES: Record<McpConfig['profile'], ReadonlySet<ToolScope>> = {
  readonly: new Set(['read']),
  standard: new Set(['read', 'write']),
  full: new Set(['read', 'write', 'destructive']),
}

export interface ConfirmDecision {
  proceed: boolean
  /** Shown to the model instead of running the tool when `proceed` is false. */
  message?: string
}

export type ConfirmFn = (input: {
  tool: ToolDefinition<z.ZodType, z.ZodType>
  args: unknown
  ctx: ToolContext
  serverCtx: ServerContext
}) => ConfirmDecision | Promise<ConfirmDecision>

/**
 * Placeholder confirm strategy — `core/confirm` (token + MRTR, plan §6) lands
 * in a later step and replaces this. Safe as a stand-in today because no
 * `destructive`-scope tool is registered before then; `registerTools` below
 * only ever invokes `confirm` for that scope.
 */
export const alwaysProceed: ConfirmFn = () => ({ proceed: true })

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
  const { server, tools, ctx, confirm } = options
  const selected = selectTools(tools, {
    profile: ctx.config.profile,
    toolsAllow: ctx.config.toolsAllow,
    toolsDeny: ctx.config.toolsDeny,
  })

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
          if (tool.scope === 'destructive') {
            const decision = await confirm({ tool, args, ctx, serverCtx })
            if (!decision.proceed) {
              return {
                content: [{ type: 'text', text: decision.message ?? 'Confirmation required.' }],
                isError: false,
              }
            }
          }

          const data = await tool.handler(args, ctx)
          return render(data, tool.view, {
            format: ctx.config.format,
            verbosity: ctx.config.verbosity,
            maxChars: ctx.config.maxChars,
          })
        } catch (err) {
          return toToolError(err)
        }
      }
    )
  }

  return selected
}
