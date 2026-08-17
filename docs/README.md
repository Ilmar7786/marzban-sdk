# Engineering docs

**What this is:** internal documentation for people (and tools) working on this
repository's code — architecture, conventions, testing, CI, releases, and the
history behind non-obvious decisions.

**What this is not:** API reference, usage guides, or examples. Those live on the
[docs site](https://ilmar7786.github.io/marzban-sdk) and in each package's `README.md`.
If a fact is answered by reading the code or a config file directly, it does not
belong here — link to the file instead of restating it.

## Map

| File                                     | Answers                                                           |
| ---------------------------------------- | ----------------------------------------------------------------- |
| [overview.md](./overview.md)             | What this repo is, what each package does, who consumes it        |
| [architecture.md](./architecture.md)     | How the packages relate: dependency graph, invariants, boundaries |
| [workspace.md](./workspace.md)           | pnpm + Turborepo + TypeScript setup, running things locally       |
| [conventions.md](./conventions.md)       | Code style, naming, commits, branching                            |
| [testing.md](./testing.md)               | Test levels, coverage rules, what's mocked and what isn't         |
| [marzban-quirks.md](./marzban-quirks.md) | Real Marzban panel behavior our code/tests work around            |
| [ci.md](./ci.md)                         | What CI checks, what gates a merge, how to reproduce it locally   |
| [release.md](./release.md)               | Versioning, tagging, changelogs, npm publish, docs deploy         |
| [history.md](./history.md)               | The project's major eras and why direction changed                |
| [adr/](./adr/README.md)                  | Individual architecture decisions, one file each                  |

Per-package architecture lives next to the code that implements it, not here:

- [`packages/sdk/ARCHITECTURE.md`](../packages/sdk/ARCHITECTURE.md)
- [`packages/mcp/ARCHITECTURE.md`](../packages/mcp/ARCHITECTURE.md)
- [`packages/cli/ARCHITECTURE.md`](../packages/cli/ARCHITECTURE.md)
- [`apps/docs/ARCHITECTURE.md`](../apps/docs/ARCHITECTURE.md)

## Keeping this current

Docs rot when nobody knows what to update. Use this table — if you touched the
left column, touch the right column in the same PR:

| You changed                                                                            | Update                                                            |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/sdk/kubb.config.ts`, `packages/sdk/openapi/openapi.json`                     | [`packages/sdk/ARCHITECTURE.md`](../packages/sdk/ARCHITECTURE.md) |
| The public export surface in `packages/sdk/src/index.ts`                               | [`packages/sdk/ARCHITECTURE.md`](../packages/sdk/ARCHITECTURE.md) |
| The MCP tool set or security profiles                                                  | [`packages/mcp/ARCHITECTURE.md`](../packages/mcp/ARCHITECTURE.md) |
| `turbo.json`, `pnpm-workspace.yaml`, any `tsconfig*.json`                              | [`workspace.md`](./workspace.md)                                  |
| `.github/workflows/ci.yml`                                                             | [`ci.md`](./ci.md)                                                |
| `.github/workflows/publish.yml`, `.github/workflows/docs.yml`, `cliff.toml`            | [`release.md`](./release.md)                                      |
| Any decision with real consequences (a new dependency direction, a discarded approach) | A new [ADR](./adr/README.md)                                      |
| `local/**`                                                                             | [`local/README.md`](../local/README.md)                           |
| A newly-observed real Marzban behavior an integration test had to work around          | [`marzban-quirks.md`](./marzban-quirks.md)                        |

Each doc file opens with a 3-line block: what it covers, what it deliberately
excludes, where to go next — so it can be read on its own, without the rest of
this directory loaded.
