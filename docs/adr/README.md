# Architecture Decision Records

**Covers:** how ADRs work in this repo and an index of the ones that exist.
**Excludes:** the reasoning itself — that's in each ADR file.
**Next:** pick a decision below, or [history.md](../history.md) for the
narrative version of the same events.

## How these work

One file per decision, numbered sequentially. **ADRs are never edited to
reflect a later change of mind** — if a decision is superseded, write a new
ADR and mark the old one `Superseded by ADR-XXXX`. This keeps each file a
true record of what was known and decided at the time.

Add a new ADR whenever a change has real, lasting consequences — a new
dependency direction, a discarded approach, a constraint future work has to
respect. Not every refactor needs one; a bug fix never does.

Template:

```markdown
# ADR-XXXX: Title

Status: Accepted | Superseded by ADR-YYYY
Date: YYYY-MM-DD

## Context

Why this decision was needed.

## Decision

What was decided.

## Consequences

What this enables, what it costs.
```

## Index

| #                                                                    | Decision                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [0001](./0001-pnpm-turborepo-monorepo.md)                            | pnpm + Turborepo monorepo with per-package releases                 |
| [0002](./0002-kubb-client-generation.md)                             | Generate the API client with kubb                                   |
| [0003](./0003-vendored-openapi-spec.md)                              | Vendor and hand-patch the OpenAPI spec                              |
| [0004](./0004-classed-generated-api-clients.md)                      | Classed generated API clients with injected HTTP client             |
| [0005](./0005-single-entry-public-api.md)                            | Single-entry public API barrier + factory construction              |
| [0006](./0006-cross-runtime-web-crypto.md)                           | Cross-runtime SDK: Web Crypto, native WebSocket, `Uint8Array`       |
| [0007](./0007-plugin-system-removed.md)                              | Plugin system removed                                               |
| [0008](./0008-100-percent-coverage.md)                               | 100% coverage on hand-written code                                  |
| [0009](./0009-version-bump-triggered-release.md)                     | Releases trigger on a version bump, not a manual tag                |
| [0010](./0010-mcp-stdio-env-config-security-model.md)                | MCP: stdio only, env-only config, profile + confirm security model  |
| [0011](./0011-per-package-release-workflows-and-mcp-docker-build.md) | Per-package release workflows; mcp's Docker image built from source |
| [0012](./0012-gate-dev-with-ci.md)                                   | Gate `dev`, not just `main`, with CI and branch protection          |
| [0013](./0013-confirm-auto-trusts-a-call-not-a-tool.md)              | `confirm: 'auto'` trusts a call, not a tool                         |
| [0014](./0014-git-cliff-unreleased-not-latest.md)                    | git-cliff uses `--unreleased`, tags pin to the commit CI ran on     |
| [0015](./0015-sdk-destroy-terminal-lifecycle.md)                     | `MarzbanSDK.destroy()` is a terminal lifecycle transition           |
| [0016](./0016-ws-stream-lifecycle-and-reconnect.md)                  | WebSocket stream lifecycle and reconnect policy                     |
