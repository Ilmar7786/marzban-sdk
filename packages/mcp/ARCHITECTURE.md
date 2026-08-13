# `marzban-mcp` architecture

**Covers:** internal structure of `packages/mcp`, the tool pipeline, the
security model, how to add a tool.
**Excludes:** how to configure or connect a client (see `packages/mcp/README.md`
and the [docs site](https://ilmar7786.github.io/marzban-sdk)), SDK internals
(see [`packages/sdk/ARCHITECTURE.md`](../sdk/ARCHITECTURE.md)).
**Next:** [`docs/testing.md`](../../docs/testing.md) for the coverage rules that apply here.

## Purpose and boundary

An MCP server that exposes Marzban panel operations as tools for AI
assistants. Built entirely on `marzban-sdk` — it never talks HTTP directly
(see the invariant in [`docs/architecture.md`](../../docs/architecture.md)).
Its own job is: pick which SDK operations to expose, gate the dangerous ones,
and format responses to fit a model's context budget.

## Directory map

| Directory            | Role                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `src/index.ts`       | Binary entry point: load config, create the SDK client, create the server, serve over stdio. |
| `src/server.ts`      | `createMarzbanMcpServer()` — builds the `McpServer` instance, registers tools and prompts.   |
| `src/config/`        | Env-driven config schema, defaults, parsing.                                                 |
| `src/core/tool/`     | Tool definition helper, registry (filtering, wiring), request context.                       |
| `src/core/confirm/`  | Confirmation-token issuing and verification for destructive tools.                           |
| `src/core/errors/`   | Maps SDK/tool errors to `CallToolResult`.                                                    |
| `src/core/logger.ts` | stderr-only logger (see invariant below).                                                    |
| `src/format/`        | Renders tool output: `view` → `text`/`table`/`json` → truncation.                            |
| `src/modules/`       | Domain modules — one directory per area (users, config, nodes, system, subscription).        |
| `src/prompts/`       | Pre-built MCP prompts that sequence existing tools for common investigations.                |
| `src/shared/`        | Cross-module schemas and small utilities (pagination, duration parsing).                     |

## Server setup

Transport is **stdio only**, via `@modelcontextprotocol/server`. Capabilities
are `{ tools: {}, prompts: {} }` — resources are deliberately not registered.

**Invariant: stdout is reserved for JSON-RPC.** Every log line goes to
stderr (`core/logger.ts` writes via `process.stderr.write`, never
`console.log`). Anything that writes to stdout breaks the protocol.

## Tool call pipeline

Every registered tool runs through the same wrapper, defined once in
`core/tool/registry.ts`:

```
selectTools() filtering  →  confirm (destructive only)  →  handler(args, ctx)  →  render(data, view)  →  error mapping
```

- **Filtering** happens once at startup: profile scope first
  (`readonly` → read-only tools, `standard` → +write, `full` → +destructive),
  then deny-globs (win over allow), then allow-globs, then a stable sort by
  name so `tools/list` output is deterministic (needed for prompt caching).
- **Annotations** (`readOnlyHint`, `destructiveHint`) are derived from each
  tool's `scope` — authors don't set them by hand.
- **Confirm** applies only to `destructive`-scoped tools, unless the tool's
  `skipConfirm(args)` returns true (used for dry-run previews). A token
  carries a TTL, a hash of the canonicalized arguments, and a per-process
  signing key; it's rejected on tool mismatch, argument mismatch, or reuse.
  `MARZBAN_MCP_CONFIRM` controls the mode: `off`, `auto` (confirm once per
  tool per session), `always`.
- **Handlers return plain data**, never a `CallToolResult` — rendering and
  error mapping are the pipeline's job, not the tool's.

## Config

Read only from environment variables — `config/env.ts` explicitly documents
that tool arguments must never carry credentials or `baseUrl`. The SDK client
is created once per process with `authenticateOnInit: false`, so the server
(and `tools/list`) comes up even if the panel is unreachable at startup.

## `format/` — why it exists

Tool output is split into a domain-aware `view` (knows how to format bytes,
timestamps, etc. using SDK helpers) and a domain-blind renderer
(`text`/`table`/`json`, chosen by `MARZBAN_MCP_FORMAT`). The response carries
both `content` (compact, for the model) and `structuredContent` (full data).
Truncation (`MARZBAN_MCP_MAX_CHARS`) always cuts on a line boundary and adds
an explicit marker — a silent cut reads to the model as "this is everything."

## Extension points

To add a tool:

1. Add `xxxInputSchema`/`xxxOutputSchema` (Zod v4) to
   `modules/<area>/<area>.schemas.ts` — reuse SDK-exported schemas where
   possible. `outputSchema` must be a single object type. Destructive tools
   need a `confirmToken` field.
2. Add a `View<T>` to `modules/<area>/<area>.views.ts`.
3. Call `defineTool({...})` in `modules/<area>/<area>.tools.ts`. The tool
   name must start with `marzban_`.
4. Add the tool to the module's export array; a new module needs one more
   line in `src/modules/index.ts`.
5. Add tests — coverage is enforced at 100% (see
   [`docs/testing.md`](../../docs/testing.md)).

`server.ts` and `core/tool/registry.ts` need no changes — filtering,
annotations, confirmation, rendering, and error mapping apply automatically.

## Known trade-offs

- The tool list is documented by hand in three places (code, `README.md`,
  the docs site) with nothing checking they agree — see
  [`docs/architecture.md`](../../docs/architecture.md).
- `core/errors/to-tool-error.ts` reads `HttpError.details.response.status`
  directly rather than through a typed SDK accessor — the one place this
  package relies on SDK internals instead of its public API.
