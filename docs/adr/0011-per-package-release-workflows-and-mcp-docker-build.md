# ADR-0011: Per-package release workflows; mcp's Docker image built from source

Status: Accepted
Date: 2026-08-21

## Context

Releases for `packages/sdk` and `packages/mcp` used to live in one
`publish.yml`, matrixed by package. That worked while both packages did
exactly the same thing (npm publish, nothing else). It stopped working once
`marzban-mcp` needed a second publish target — a Docker image on Docker
Hub — because a matrix forces shared `permissions` and shared conditional
steps (`if: matrix.pkg == 'marzban-mcp'`) onto a job that sdk's release also
runs through. That's the opposite of "releases are independent, each can
have its own flow and publish targets."

Separately, publishing `marzban-mcp`'s Docker image raised a second
question: build the image from source, or install the already-published npm
package inside it?

## Decision

- **One workflow file per publishable package** — `release-sdk.yml`,
  `release-mcp.yml` — each with its own trigger evaluation and its own list
  of publish targets. No matrix, no shared job. The parts that are genuinely
  identical (dry-run version-bump detection, changelog generation, the
  changelog commit-back-with-retry) are factored into composite actions
  (`.github/actions/release-prepare`, `.github/actions/commit-changelog`)
  that each workflow calls independently — shared code, independent
  execution and failure domains.
- **mcp's Docker image is built from source** (`packages/mcp/Dockerfile`,
  repo root as build context), not layered on top of the published npm
  package. The build runs `pnpm --filter=marzban-mcp deploy --prod` inside
  the image itself.

## Consequences

- sdk's release can never be blocked, slowed, or broken by mcp's Docker
  step failing, and vice versa — they don't share a job, a matrix entry, or
  a permissions block.
- Adding a third publish target to either package (e.g. GHCR, a VS Code
  extension) means editing one file, not touching a shared matrix that the
  other package's release also runs through.
- Building from source means the Docker image can be built and smoke-tested
  in CI (or locally) without needing anything to exist on npm first — useful
  for PR-time verification once that's added, and for the very first release
  where the npm package doesn't exist yet either. The tradeoff: the
  Docker build step re-runs `pnpm install` and the Turborepo build inside the
  image, rather than a one-line `npm install -g`.
- `packages/mcp/package.json`'s `"marzban-sdk": "workspace:^"` still needs
  rewriting to a real version range before `npm publish` (npm only resolves
  `workspace:` for its own `workspaces` field, and this repo uses pnpm
  workspaces) — this is unrelated to the workflow split and would have been
  needed either way; `scripts/resolve-workspace-deps.mjs` handles it.
