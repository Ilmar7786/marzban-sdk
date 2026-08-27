# ADR-0012: Gate `dev`, not just `main`, with CI and branch protection

Status: Accepted
Date: 2026-08-27

## Context

In practice, feature branches have not been merged straight into `main` for
a while — they go into `dev` first, and `dev` is later merged into `main`
through its own PR (see the `Ilmar7786/marzban-sdk#93`, `#92` PR history:
base `dev`, not `main`). `dev` had become the real integration branch, but
`CONTRIBUTING.md` still instructed contributors to open PRs against `main`,
and neither `ci.yml` nor `integration.yml` triggered on `dev` at all — only
on `main`. `main` also had no branch protection configured, so even there
CI passing was informational, not enforced.

The result: a feature branch could merge into `dev` with a broken build,
failing tests, or a type error, and that would only surface later when `dev`
was merged into `main` — by which point the failure is entangled with
whatever else landed on `dev` in between, instead of pointing at the PR that
caused it.

## Decision

- Extend `ci.yml` and `integration.yml` `pull_request` triggers to `dev` in
  addition to `main`, so every PR into `dev` gets the same `lint` /
  `types:check` / `test` / `build` / `format:check` run and the same
  integration-suite signal that `main` already had. The `push` trigger stays
  on `main` only — see the note below on why `dev` isn't also a push branch.
- Add GitHub branch protection to both `main` and `dev`, requiring the `ci`
  status check to pass (and the branch to be up to date) before a PR can
  merge. `integration` stays informational on both branches, same as it
  already was on `main` — real network + Docker startup makes it slower and
  less deterministic, so it doesn't gate the merge.
- `enforce_admins` is left `false` on both branches, so the repo owner can
  still push past the rule for a genuine emergency.
- `CONTRIBUTING.md` is updated to describe the actual flow (PR into `dev`,
  `dev` merges into `main` periodically) instead of the stale "PR against
  `main`" instruction.
- `push` stays scoped to `main` on both workflows — it is not added for
  `dev`. `dev` is protected the same way `main` is (direct pushes are
  blocked), so its only path in is a PR, which the `pull_request` trigger
  already covers. Adding `push: [main, dev]` as well would double-run every
  `dev`-bound PR (once as `pull_request`, once as `push` on the PR's head
  branch, since that branch is also listed) — both runs get the same
  `Required` status, so a flake in either one blocks the merge even when
  the other is green. A `concurrency` group per workflow additionally
  cancels a superseded run when the PR branch is pushed again quickly.

## Consequences

- A broken feature branch is now caught at the PR that introduces it, not
  discovered later in a `dev` → `main` merge that bundles unrelated commits.
- `dev` and `main` behave the same way for contributors — same required
  check, same up-to-date requirement — so there's one mental model instead
  of "checks only really matter once you're merging to `main`."
- Opening a PR into `dev` is slightly slower (waits on the same CI run
  `main` PRs wait on), which is the intended tradeoff — catching problems
  earlier costs a few minutes per PR.
