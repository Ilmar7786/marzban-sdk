# Release

**Covers:** how a package release ships to npm, how the docs site deploys.
**Excludes:** what gates the CI run that has to pass first (see [ci.md](./ci.md)).
**Next:** [history.md](./history.md) for how this pipeline came to exist.

## Package releases

Each publishable package has its own release workflow —
[`release-sdk.yml`](../.github/workflows/release-sdk.yml) and
[`release-mcp.yml`](../.github/workflows/release-mcp.yml) — with its own
trigger evaluation, its own publish targets, and no shared job or matrix
between them. One package's release failing never blocks or skips the
other's. `packages/cli` doesn't have one yet — it's still unpublished (see
[`packages/cli/ARCHITECTURE.md`](../packages/cli/ARCHITECTURE.md)).

Both workflows share the same two building blocks, factored into composite
actions so the two files don't duplicate the fiddly parts:

- [`.github/actions/release-prepare`](../.github/actions/release-prepare) —
  runs `npm publish --dry-run` to detect whether `package.json`'s version
  actually changed since what's on npm, and if so prepends the package's
  `CHANGELOG.md` and renders release notes with git-cliff.
- [`.github/actions/commit-changelog`](../.github/actions/commit-changelog) —
  commits the updated changelog back to `main` as `github-actions[bot]`, with
  a retry loop for the case where both packages release around the same time
  and race on the push.

Each workflow otherwise runs a straight sequence of steps in a single job —
no job-to-job output plumbing — because mcp's release body depends on the
Docker image digest, which only exists partway through:

```
bump "version" in packages/<pkg>/package.json, merge to main
  → CI runs on main and succeeds
  → release-<pkg>.yml runs (triggered by workflow_run, not by the push itself)
      release-prepare  (dry-run detects the version bump → changelog → notes)
      → [mcp only] docker buildx build --push (amd64 + arm64; Docker Hub auth via stored secrets, not OIDC)
      → [mcp only] resolve workspace:* deps to real ranges (see below)
      → npm publish --provenance (OIDC, no stored npm token)
      → artifact links appended to the release notes
      → GitHub Release created, tag = "<prefix>v<version>"
      → commit-changelog pushes the CHANGELOG.md update back to main
```

mcp's Docker build runs **before** the workspace-range rewrite, not after — see the next section for why the order matters.

`release-prepare` runs git-cliff with `--unreleased`, not `--latest` — the
tag for the version being released doesn't exist yet at this point (`Create
GitHub Release` creates it several steps later), so `--latest` would resolve
to the _previous_ release's commits instead. See
[ADR-0014](./adr/0014-git-cliff-unreleased-not-latest.md) for the failure
this caused across nine releases and why `--unreleased` is correct here.
`--latest` is still used, but only as a fallback for resuming a
`force_publish` release whose tag a prior, partially-failed attempt already
created.

**Nobody creates a release tag by hand** — the GitHub Release step creates it
from `tag_prefix + version`. Tag prefixes: `sdk-v*`, `mcp-v*`.

If the dry-run step finds the version in `package.json` unchanged from what's
already on npm, the workflow stops there — publishing nothing. This is what
makes it safe for both release workflows to run on every `main` push without
over-publishing.

### Why mcp's package.json gets rewritten before publish — and only right before

`packages/mcp/package.json` depends on `marzban-sdk` via `workspace:^`. npm
only rewrites the `workspace:` protocol for workspaces declared in its own
`workspaces` field — this repo uses pnpm workspaces instead, so the root
`package.json` has no such field, and `npm publish` would ship the literal
string `workspace:^`, which `npm install` can't resolve outside this repo.
[`scripts/resolve-workspace-deps.mjs`](../scripts/resolve-workspace-deps.mjs)
rewrites it to the real published range right before `npm publish` runs, in
CI only — the change is never committed back to git.

This rewrite has to run **after** the Docker build, not before. The Docker
build's context is the same checked-out working tree (`COPY . .`), and its
`pnpm install --frozen-lockfile` needs `packages/mcp/package.json` to still
say `workspace:^`, matching what `pnpm-lock.yaml` was actually generated
against — `pnpm deploy` inside the Dockerfile resolves the workspace
protocol correctly on its own. Rewriting the file first desyncs it from the
lockfile and `--frozen-lockfile` fails; this is exactly what broke the first
real mcp release (npm succeeded, the Docker step failed on a lockfile
mismatch) before the step order was fixed.

### Recovering a partially-failed release

`release-mcp.yml` publishes to npm and then to Docker Hub in sequence. If the
Docker step fails after npm already succeeded, re-running the workflow
normally does nothing — the dry-run check sees the version already on npm and
skips. Use `workflow_dispatch` with `force_publish: true` to force the rest of
the pipeline (Docker build/push, release, changelog) to run again for that
same version; `npm publish` itself is a no-op for a version already published.

### Dry-running a release

```
workflow_dispatch → dry_run: true (the default)
```

Runs the same pipeline with `npm publish --dry-run`, a draft GitHub Release,
and — for mcp — `docker buildx build` without `--push`. Nothing lands on npm
or Docker Hub, no tag, no changelog commit.

### Checking a changelog before it's generated in CI

```sh
pnpm changelog:sdk   # or changelog:cli / changelog:mcp
```

Uses `--unreleased`, same as CI (see ADR-0014) — this only shows something
useful before the package's own tag exists locally. If you've already run a
real release for the current `package.json` version (so its tag exists), the
range is empty and this prints nothing; that's expected, not a bug in the
preview.

### Changelog grouping

`cliff.toml` groups commits by Conventional Commit type into sections
(Features, Bug Fixes, Performance, Refactor, …); `docs`-scoped and
`chore(release|deps|changelog)` commits are excluded so the changelog stays
user-facing. This is why the commit format in
[conventions.md](./conventions.md) matters beyond `git log` readability.

One consequence of scoping git-cliff to `packages/mcp/**`: a fix that lands
in `packages/sdk` and changes mcp's runtime behavior would never show up in
mcp's own changelog, since the path filter drops the sdk commit before
`commit_parsers` ever sees it.

### Surfacing sdk changes in mcp's changelog

[`scripts/downstream-notes.mjs`](../scripts/downstream-notes.mjs) builds a
`### 🔗 From marzban-sdk` section and passes it to git-cliff via
`--with-tag-message`; `cliff.toml`'s body template inserts it verbatim when
present (guarded by a `### 🔗` sentinel so an unrelated lightweight-tag
message can't leak in). `release-mcp.yml` runs it before **Prepare release**
and clears the pending-notes file after a real (non-dry-run) publish. Three
sources feed the section:

- **The sdk version bump**, always. The script diffs
  `packages/sdk/package.json`'s version against what it was at the previous
  `mcp-v*` tag and adds a "Bundles marzban-sdk X.Y.Z (was A.B.C)" bullet
  linking to the sdk release notes whenever it changed. This is the floor —
  it can't be forgotten, but it doesn't say _what_ changed.
- **Commits scoped `fix(sdk,mcp): ...`** (or any type — commitlint's
  `scope-enum` already accepts a comma-separated scope list, no config
  change needed). Use this scope when an sdk commit changes mcp's observable
  behavior; the script picks up every such commit between the previous
  `mcp-v*` tag and the release and includes its description verbatim.
- **[`.changelog/mcp-downstream.md`](../.changelog/mcp-downstream.md)**, a
  hand-maintained escape hatch for sdk changes that can't be marked on the
  commit — already merged without the scope, or whose effect on mcp only
  became clear afterward. Add one bullet per line; the next mcp release
  folds them in and clears the file. Deliberately kept outside
  `packages/sdk/**` and `packages/mcp/**` so it isn't itself caught by
  either package's path filter.

Preview the section before a release: `node scripts/downstream-notes.mjs
mcp` (also wired into `pnpm changelog:mcp`).

One thing this mechanism does _not_ cover: after
[`scripts/resolve-workspace-deps.mjs`](../scripts/resolve-workspace-deps.mjs)
rewrites `marzban-mcp`'s dependency range, npm installs of `marzban-mcp` can
pick up a newer `marzban-sdk` **without an mcp release happening at all** —
the changelog section above only fires when mcp itself releases. The Docker
image doesn't have this problem since it vendors a specific sdk version at
build time.

## mcp's Docker image

[`packages/mcp/Dockerfile`](../packages/mcp/Dockerfile) is a two-stage build
with the **repo root** as build context (it needs the pnpm workspace and
`packages/sdk`'s source, not just `packages/mcp`):

- **builder** (`--platform=$BUILDPLATFORM`, i.e. always the host arch, never
  emulated): installs the `marzban-mcp...` workspace subset, runs the
  Turborepo build, then `pnpm --filter=marzban-mcp deploy --prod --legacy
/out` to produce a self-contained install (mcp + its resolved `marzban-sdk`
  dependency + prod `node_modules`, no other workspace packages).
- **runtime**: plain `node:24-alpine`, copies `/out`, runs as the non-root
  `node` user.

Building the emulated stage only for the platform swap (not the whole
toolchain) is why `linux/arm64` doesn't need QEMU to run the actual build —
the output is pure JS, only the base image differs per platform.

The image talks MCP over stdio, same as the npm package — there's no port to
`EXPOSE` and nothing to health-check from outside the container. Run it with
`docker run -i --rm`.

## Manual setup (one-time)

Steps that don't reduce to code and have to be done by hand before the
pipelines above can run for real:

1. **Docker Hub**: create the `ilmar7786/marzban-mcp` repository, and a
   personal access token scoped to Read & Write.
2. **GitHub secrets**: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (Settings →
   Secrets and variables → Actions).
3. **First `marzban-mcp` npm publish, done by hand.** npm's Trusted Publisher
   (OIDC) can only be configured on a package that already exists on npm, and
   `marzban-mcp` doesn't yet:
   ```sh
   pnpm turbo run build --filter=marzban-mcp
   node scripts/resolve-workspace-deps.mjs packages/mcp
   npm --prefix packages/mcp publish --access public
   git checkout packages/mcp/package.json   # undo the workspace: rewrite locally
   ```
4. **Configure Trusted Publisher** for `marzban-mcp` on npmjs.com (package
   page → Settings → Trusted Publisher → GitHub Actions), repository
   `Ilmar7786/marzban-sdk`, workflow `release-mcp.yml`. Only after this does
   the automated `npm publish --provenance` step in the workflow succeed.
5. Confirm `marzban-sdk`'s existing Trusted Publisher entry points at
   `release-sdk.yml`, not the old `publish.yml` — it needs updating after the
   rename, or the next automated sdk release fails on npm auth.

## Docs site deploy

```
push to main touching apps/docs/**
  → pnpm turbo run build --filter=marzban-sdk-docs   (static export → apps/docs/out)
  → touch out/.nojekyll
  → upload-pages-artifact → deploy-pages
```

Deploys to `https://ilmar7786.github.io/marzban-sdk/`. `basePath` is set in
both `next.config.mjs` and `src/lib/shared.ts` — see
[`apps/docs/ARCHITECTURE.md`](../apps/docs/ARCHITECTURE.md) for why
that duplication is intentional.
