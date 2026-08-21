import type { ToolAnnotations } from '@modelcontextprotocol/server'
import type { z } from 'zod'

import type { View } from '@/format/views/types'

import type { ToolContext } from './context'

export type ToolScope = 'read' | 'write' | 'destructive'

const NAMESPACE_PREFIX = 'marzban_'

/**
 * A tool as data, not code: registration, confirmation, rendering, and error
 * mapping all live in `registry.ts` and apply identically to every tool
 * defined here. `readOnlyHint`/`destructiveHint` are deliberately not fields
 * on this type — the registry derives them from `scope` so they can never
 * drift out of sync with it; only the genuinely per-tool hints are settable.
 */
export interface ToolDefinition<I extends z.ZodType, O extends z.ZodType> {
  /** Must start with `marzban_` — the namespace is what lets a host tell this server's tools apart from every other MCP server's. */
  name: string
  title: string
  /** Written for a new hire, not a teammate — includes steering on when to prefer this tool over a costlier alternative (see plan §5). */
  description: string
  inputSchema: I
  outputSchema: O
  scope: ToolScope
  annotations?: Pick<ToolAnnotations, 'idempotentHint' | 'openWorldHint'>
  view: View<z.infer<O>>
  handler: (args: z.infer<I>, ctx: ToolContext) => Promise<z.infer<O>>
  /**
   * `scope: 'destructive'` only. Describes what this specific call would do
   * before it happens — shown to the model (and, through it, the user) as
   * part of the confirmation prompt (plan §6.1/§6.3: a host's "Allow" dialog
   * shows the tool name and arguments, never the consequences). Free to call
   * the SDK for context (e.g. read the target user before a delete). Falls
   * back to a generic description in `core/confirm` when omitted.
   */
  describeConsequences?: (args: z.infer<I>, ctx: ToolContext) => string | Promise<string>
  /**
   * `scope: 'destructive'` only. When it returns true for a given call, the
   * registry skips confirmation for that call — for `dry_run`-style flags
   * where the call provably makes no change (plan §6.5), so a preview isn't
   * gated behind the same confirmation as the real write it's previewing.
   * Defaults to always confirming when omitted.
   */
  skipConfirm?: (args: z.infer<I>, ctx: ToolContext) => boolean
}

/** Identity function — exists purely so object-literal callers get contextual type inference for `inputSchema`/`outputSchema`/`handler` without spelling out the generics by hand. */
export function defineTool<I extends z.ZodType, O extends z.ZodType>(
  definition: ToolDefinition<I, O>
): ToolDefinition<I, O> {
  if (!definition.name.startsWith(NAMESPACE_PREFIX)) {
    throw new Error(`Tool name "${definition.name}" must start with "${NAMESPACE_PREFIX}".`)
  }
  return definition
}
