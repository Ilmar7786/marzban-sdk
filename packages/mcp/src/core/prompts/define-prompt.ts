import type { GetPromptResult } from '@modelcontextprotocol/server'
import type { z } from 'zod'

/**
 * A prompt as data, same spirit as `core/tool/define-tool.ts`'s `ToolDefinition`
 * — though prompts have no scope/confirm/render pipeline to share, since
 * they never touch the SDK themselves. A prompt is just a canned message
 * that steers the model toward the right sequence of (already
 * profile-filtered, already confirm-gated) tool calls; the tools it
 * mentions still enforce every safety rule on their own.
 */
export interface PromptDefinition<A extends z.ZodType> {
  name: string
  title: string
  description: string
  argsSchema: A
  /** Prompt arguments arrive over the wire as strings (MCP `PromptArgument` has no other type) — parse/validate inside the handler if a value needs to be a number. */
  handler: (args: z.infer<A>) => GetPromptResult
}

/** Identity function — mirrors `defineTool`'s role of giving object-literal callers contextual type inference. */
export function definePrompt<A extends z.ZodType>(definition: PromptDefinition<A>): PromptDefinition<A> {
  return definition
}
