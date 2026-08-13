# Release

**Covers:** how a package release ships to npm, how the docs site deploys.
**Excludes:** what gates the CI run that has to pass first (see [ci.md](./ci.md)).
**Next:** [history.md](./history.md) for how this pipeline came to exist.

## Package releases

Two independent things happen, both automated once a `package.json` version
bump lands on `main`:

```
bump "version" in packages/<pkg>/package.json, merge to main
  → CI runs on main and succeeds
  → publish.yml runs (triggered by workflow_run, not by the push itself)
  → per-package matrix job:
      npm-publish --dry-run  (detects whether the version actually changed)
      → git-cliff prepends packages/<pkg>/CHANGELOG.md
      → npm publish --provenance (OIDC, no stored npm token)
      → GitHub Release created, tag = "<prefix>v<version>"
      → changelog commit pushed back to main as github-actions[bot], [skip ci]
```

**Nobody creates a release tag by hand** — the GitHub Release step creates it
from `tag_prefix + version`. Tag prefixes: `sdk-v*`, `mcp-v*`. `packages/cli`
has a matrix row prepared but commented out until it's ready to publish (see
[`packages/cli/ARCHITECTURE.md`](../packages/cli/ARCHITECTURE.md)).

If the dry-run step finds the version in `package.json` unchanged from what's
already on npm, that package's matrix job stops there — publishing nothing.
This is what makes it safe for `publish.yml` to run on every `main` push
without over-publishing.

### Dry-running a release

```
workflow_dispatch → dry_run: true (the default)
```

Runs the same pipeline with `npm publish --dry-run` and a draft GitHub
Release — nothing lands on npm, no tag, no changelog commit.

### Checking a changelog before it's generated in CI

```sh
pnpm changelog:sdk   # or changelog:cli / changelog:mcp
```

### Changelog grouping

`cliff.toml` groups commits by Conventional Commit type into sections
(Features, Bug Fixes, Performance, Refactor, …); `docs`-scoped and
`chore(release|deps|changelog)` commits are excluded so the changelog stays
user-facing. This is why the commit format in
[conventions.md](./conventions.md) matters beyond `git log` readability.

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
