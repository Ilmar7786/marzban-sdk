# `marzban-cli` architecture

**Covers:** current state of `packages/cli`, what's scaffolded, what it takes
to ship a first version.
**Excludes:** anything not yet built — there's no design to document beyond
the skeleton.
**Next:** [`packages/sdk/ARCHITECTURE.md`](../sdk/ARCHITECTURE.md)
for what a real implementation would build on.

## Current state

A package skeleton, not a CLI. `src/index.ts` is nine lines: it reads
`name`/`version` from `package.json` and prints
`` `${name} v${version} — not implemented yet` ``. No commands, no argument
parsing, no tests.

## What's already scaffolded

- `dependencies: { "marzban-sdk": "workspace:^" }` — not yet imported anywhere.
- `bin: { "marzban": "./dist/index.js" }` and a tsup config matching the MCP
  package's (ESM, shebang banner) — so `pnpm --filter marzban-cli build` and
  `npx marzban` already work end-to-end for the placeholder.
- A `changelog:cli` root script and a `cli-v*` tag pattern in
  [`docs/release.md`](../../docs/release.md) — release plumbing exists
  before the package does.
- `"private": true` in `package.json`, and its row commented out in the
  publish matrix (`.github/workflows/publish.yml`) — this is what keeps it
  off npm.

## What's missing for a first release

1. Actual commands, built on `marzban-sdk` the same way `marzban-mcp` is —
   no HTTP of its own (see the invariant in
   [`docs/architecture.md`](../../docs/architecture.md)).
2. A test suite — `package.json` has no `test` script yet, and CI won't
   enforce coverage on this package until one exists.
3. Remove `"private": true` and uncomment the `packages/cli` row in the
   publish matrix.
