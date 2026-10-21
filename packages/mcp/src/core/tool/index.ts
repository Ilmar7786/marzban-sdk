export { compactJsonSchema } from './compact-json-schema'
export type { ToolContext } from './context'
export { defineTool, type ToolDefinition, type ToolScope } from './define-tool'
export {
  EXECUTION_META_KEY,
  type ExecutionMeta,
  executionMetaSchema,
  registeredOutputSchema,
  withExecutionMeta,
} from './execution-meta'
export { toolJsonSchema, toolOutputJsonSchema, withWireJsonSchema } from './json-schema'
export {
  alwaysExecute,
  alwaysProceed,
  type ConfirmDecision,
  type ConfirmFn,
  type DedupFn,
  type DedupOutcome,
  registerTools,
  type RegisterToolsOptions,
  selectTools,
  type SelectToolsOptions,
} from './registry'
