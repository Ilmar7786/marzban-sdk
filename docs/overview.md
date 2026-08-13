# Overview

**Covers:** what this repository is, what each package does, who consumes it.
**Excludes:** how to use the SDK (see the [docs site](https://ilmar7786.github.io/marzban-sdk)), how the packages relate internally (see [architecture.md](./architecture.md)).
**Next:** [architecture.md](./architecture.md) for the dependency graph and boundaries.

## What this is

A monorepo providing typed TypeScript access to the [Marzban](https://github.com/Gozargah/Marzban)
panel API, and two artifacts built on top of that access: an MCP server and a CLI.

## Packages

| Package                                           | What it is                                                                                                                             | Status                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| [`packages/sdk`](../packages/sdk) → `marzban-sdk` | The typed API client. Generated endpoints, auth, retries, WebSocket log streams, webhooks. Everything else in this repo depends on it. | Published to npm         |
| [`packages/mcp`](../packages/mcp) → `marzban-mcp` | An MCP server exposing Marzban operations as tools for AI assistants (Claude, Cursor, etc.), built entirely on the SDK.                | Published to npm         |
| [`packages/cli`](../packages/cli) → `marzban-cli` | A command-line client. Package skeleton only — no commands implemented yet.                                                            | Unpublished (`private`)  |
| [`apps/docs`](../apps/docs)                       | The public documentation site — usage guides and API reference for `marzban-sdk` and `marzban-mcp`.                                    | Deployed to GitHub Pages |

## Stack

TypeScript (strict), ESM-first, Node ≥ 24. pnpm workspaces + Turborepo for the
monorepo. Vitest for tests, tsup for bundling, [kubb](https://kubb.dev) for
generating the API client from OpenAPI, Zod v4 for runtime validation.

## Consumers

- `marzban-sdk` — any Node.js, browser, Bun, or Deno application talking to a Marzban panel.
- `marzban-mcp` — MCP-compatible AI clients (Claude Desktop, Claude Code, Cursor, …).
- `marzban-cli` — not yet usable.
