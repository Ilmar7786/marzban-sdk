# ADR-0005: Single-entry public API barrier + factory construction

Status: Accepted
Date: 2026-02-09

## Context

Internal restructuring (splitting `core/` into `auth/`, `http/`, `ws/`,
`logger/`, etc., and — separately — the plugin system's requirement for
async initialization, see [ADR-0007](./0007-plugin-system-removed.md)) meant
the SDK needed a stable public contract independent of how its internals
were organized, and a way to construct an instance that could do async work
before returning.

## Decision

`packages/sdk/src/index.ts` is the sole public entry point. It exports
selected names deliberately (either narrow named exports or a full blanket
re-export per module — never "everything"), and exports `MarzbanSDK` itself
only as a type. The supported way to construct an instance is
`createMarzbanSDK(config)`, an async factory, not `new MarzbanSDK()`.

## Consequences

- Internal restructuring of `core/` never breaks consumers, as long as
  `index.ts`'s exports stay stable.
- When a consumer package needs something new, it's added as a named export
  to `index.ts` — see the pattern that shipped logger types, `ERROR_CODES`,
  and `redactSecrets` for `packages/mcp` (documented in
  [history.md](../history.md)).
- The factory function outlived the plugin system that originally required
  it and is now the permanent construction path, `new MarzbanSDK()` included
  as a (non-recommended) fallback for callers who don't need the factory.
