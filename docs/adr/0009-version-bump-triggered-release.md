# ADR-0009: Releases trigger on a version bump, not a manual tag

Status: Accepted
Date: 2026-08-10

## Context

With per-package releases (see
[ADR-0001](./0001-pnpm-turborepo-monorepo.md)), the repo needed a release
trigger that couldn't drift out of sync with what's actually in
`package.json`, and that worked independently for each publishable package
without a human running per-package release commands.

## Decision

A package release is triggered by its `version` field changing in
`package.json` on `main`. `publish.yml` runs after CI succeeds on `main`
(via `workflow_run`), and for each package runs an `npm publish --dry-run`
first purely to detect whether the version actually changed since what's on
npm. If it has: git-cliff prepends the changelog, `npm publish` runs with
OIDC provenance (no stored npm token), a GitHub Release is created with tag
`<prefix><version>`, and the changelog commit is pushed back to `main` as
`github-actions[bot]`.

## Consequences

- No one creates release tags by hand — the tag is a byproduct of the
  GitHub Release step, always derived from `tag_prefix + version`.
- The pipeline is safe to run on every push to `main`: packages whose
  version didn't change are simply skipped by the dry-run check, so merging
  unrelated work never triggers an accidental publish.
- A `workflow_dispatch` input (`dry_run`, default `true`) allows rehearsing
  the entire pipeline — dry-run npm publish, draft GitHub Release, no
  changelog commit — before a real release.
