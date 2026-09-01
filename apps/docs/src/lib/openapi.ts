import rawSpec from '../../../../packages/sdk/openapi/openapi.json'

/** Loose shape of the OpenAPI document — just enough to walk operations and `$ref`s. */
interface RawSpec {
  info?: { version?: string }
  paths: Record<string, Record<string, RawOperation>>
}

interface RawOperation {
  tags?: string[]
  summary?: string
  responses?: Record<string, { content?: Record<string, { schema?: JsonSchema }> }>
}

type JsonSchema = { $ref?: string } & Record<string, unknown>

const spec = rawSpec as unknown as RawSpec

// Schemas ADR-0003 patches with `additionalProperties: true` — the source of
// truth is packages/sdk/src/gen-regression.test.ts, which pins the generated
// behavior for exactly these. `ProxySettings` is a named component reused
// across user responses; the two core-config operations patch an inline,
// unnamed schema, so they're keyed by operation instead of by schema name.
// The value is the short reason shown on the endpoint's badge.
// See docs/adr/0003-vendored-openapi-spec.md.
const PATCHED_SCHEMA_REASONS: Record<string, string> = { ProxySettings: 'proxies patched' }
const PATCHED_OPERATION_REASONS: Record<string, string> = {
  'GET /api/core/config': 'config patched',
  'PUT /api/core/config': 'config patched',
}

// The SDK's own module grouping (see content/docs/modules/), not the spec's
// tag-declaration order — which buries `User`, the biggest and most-used
// group, seventh.
const TAG_ORDER = ['User', 'Admin', 'Node', 'System', 'Core', 'Subscription', 'User Template']

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

/** Resolve a local `#/components/...` `$ref` against the spec document. */
function resolveRef(ref: string): JsonSchema | undefined {
  return ref
    .replace(/^#\//, '')
    .split('/')
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], spec) as
    JsonSchema | undefined
}

/** Walks a schema's `$ref` chain looking for a patched named schema; returns its reason text. */
function findPatchReason(schema: JsonSchema | undefined, seen: Set<string> = new Set()): string | undefined {
  if (!schema || typeof schema !== 'object') return undefined

  if (schema.$ref) {
    if (seen.has(schema.$ref)) return undefined
    seen.add(schema.$ref)
    const reason = PATCHED_SCHEMA_REASONS[schema.$ref.split('/').pop() ?? '']
    return reason ?? findPatchReason(resolveRef(schema.$ref), seen)
  }

  for (const value of Object.values(schema)) {
    const reason = Array.isArray(value)
      ? value.map(entry => findPatchReason(entry as JsonSchema, seen)).find(Boolean)
      : findPatchReason(value as JsonSchema, seen)
    if (reason) return reason
  }
  return undefined
}

/** Why (if at all) this operation's data is affected by an ADR-0003 patch. */
function getPatchReason(method: string, path: string, operation: RawOperation): string | undefined {
  const operationReason = PATCHED_OPERATION_REASONS[`${method} ${path}`]
  if (operationReason) return operationReason

  for (const [code, response] of Object.entries(operation.responses ?? {})) {
    if (!code.startsWith('2')) continue
    const reason = findPatchReason(response.content?.['application/json']?.schema)
    if (reason) return reason
  }
  return undefined
}

export interface OpenApiOperation {
  method: string
  path: string
  summary: string
  /** Short reason this endpoint's data is affected by an ADR-0003 patch, or `undefined` if it isn't. */
  patchReason?: string
}

export interface OpenApiGroup {
  tag: string
  operations: OpenApiOperation[]
}

export interface OpenApiMeta {
  version: string
  endpointCount: number
  patchedCount: number
  groups: OpenApiGroup[]
}

/** All endpoints grouped by tag (in module order), plus spec-wide counts — one pass over the spec. */
export function getOpenApiMeta(): OpenApiMeta {
  const groups = new Map<string, OpenApiOperation[]>()
  let endpointCount = 0
  let patchedCount = 0

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]
      if (!operation) continue

      const tag = operation.tags?.[0]
      // Untagged operations are the panel's own HTML health check, not part
      // of the SDK's typed surface (see ADR-0005, single-entry public API) —
      // skip rather than show a stray row nobody can call through the SDK.
      if (!tag) continue

      const methodUpper = method.toUpperCase()
      const patchReason = getPatchReason(methodUpper, path, operation)
      endpointCount++
      if (patchReason) patchedCount++

      const rows = groups.get(tag) ?? []
      rows.push({ method: methodUpper, path, summary: operation.summary ?? '', patchReason })
      groups.set(tag, rows)
    }
  }

  const orderedTags = [
    ...TAG_ORDER.filter(tag => groups.has(tag)),
    ...[...groups.keys()].filter(tag => !TAG_ORDER.includes(tag)),
  ]

  return {
    version: spec.info?.version ?? 'unknown',
    endpointCount,
    patchedCount,
    groups: orderedTags.map(tag => ({ tag, operations: groups.get(tag) ?? [] })),
  }
}
