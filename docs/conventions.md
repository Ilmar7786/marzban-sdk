# Conventions

**Covers:** code style enforcement, commit format, branching model.
**Excludes:** how to run lint/test locally (see [workspace.md](./workspace.md)),
what CI enforces (see [ci.md](./ci.md)).
**Next:** [testing.md](./testing.md).

## Code style

ESLint flat config: `eslint.config.js` at the root composes
`eslint.shared.js` (the house style, also used by `apps/docs`'s own config).
Key rules: `simple-import-sort` for import/export ordering,
`unused-imports/no-unused-imports` as an error, Prettier violations as
ESLint errors (`eslint-plugin-prettier`). `@typescript-eslint/no-explicit-any`
is relaxed only for `**/src/gen/**` — generated code doesn't need to satisfy
hand-written-code rules.

Prettier config (`.prettierrc`): 2-space indent, single quotes, no semicolons,
120-char print width. `.prettierignore` excludes `apps/docs/content/**/*.mdx`
— the MDX printer mangles fenced code blocks that contain JSX, so MDX content
is formatted by hand.

```sh
pnpm lint          # across every package
pnpm lint:fix
pnpm format        # Prettier, whole repo
```

## Naming

Files: kebab-case. Type-only files: `*.types.ts`. Tests: `*.test.ts`,
co-located next to the code they cover (see [testing.md](./testing.md)).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint via a Husky `commit-msg` hook. Commit messages are the direct
input to each package's changelog (git-cliff groups by type — see
[release.md](./release.md)) — a wrong type or missing scope shows up wrong in
the published changelog, not just in `git log`.

```
type(scope?): short description

BREAKING CHANGE: description   ← drives a major version bump
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`,
`ci`. Scope is enforced by `commitlint.config.js`'s `scope-enum`:
`sdk | cli | mcp | docs | deps | ci | release | changelog`.

## Pre-commit

Husky + lint-staged (`.husky/pre-commit`): staged `.ts`/`.tsx`/`.js` files run
through `eslint --fix`; staged `.json`/`.md`/`.yml`/`.css` run through
`prettier --write`. `.husky/commit-msg` runs commitlint.

## Branching

Feature branches (`feat/*`, `fix/*`, `task/*`) → PR → merge to `dev` → merge
to `main` (which triggers release — see [release.md](./release.md)). Merges
are plain GitHub "Merge pull request" commits, not squash or rebase.
