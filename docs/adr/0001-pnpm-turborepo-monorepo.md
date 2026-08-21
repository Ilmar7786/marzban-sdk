# ADR-0001: pnpm + Turborepo monorepo with per-package releases

Status: Accepted
Date: 2026-08-10

## Context

The project was a single npm package (`marzban-sdk`). Two new artifacts were
planned on top of it — an MCP server and a CLI — that needed their own
`package.json`, their own release cadence, and their own tests, without
becoming submodules of the SDK's build.

## Decision

Convert the repository to a pnpm workspace (`packages/*`, `apps/*`) with
Turborepo orchestrating `build`/`lint`/`test`/`types:check`. Each publishable
package keeps its own version, `CHANGELOG.md`, and release tag prefix
(`sdk-v*`, `cli-v*`, `mcp-v*`) instead of a single repo-wide version.

## Consequences

- New artifacts (`packages/mcp`, `packages/cli`) can depend on the SDK via
  `workspace:^` and release independently of it.
- CI and publish workflows became per-package (a matrix job), not a single
  flat pipeline — more moving parts, but a broken `cli` build no longer
  blocks an `sdk` release.
- The migration landed on `dev` and has not yet merged to `main`; `main`
  still runs the old single-package CI/publish. See
  [history.md](../history.md).
