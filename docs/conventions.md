# Conventions

**Covers:** code style enforcement, commit format, the context budget, branching model.
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

Scope can be a comma-separated list. Use `fix(sdk,mcp): ...` (or any other
type) for an sdk commit that also changes marzban-mcp's observable behavior
— [`scripts/downstream-notes.mjs`](../scripts/downstream-notes.mjs) picks up
commits scoped this way and surfaces them in mcp's changelog too, since
mcp's changelog is otherwise generated only from `packages/mcp/**` commits.
See [release.md](./release.md) for the full mechanism.

## Context budget

`marzban-mcp` sends its whole `tools/list` at the start of every
conversation, so the size of that payload is a cost every user pays in every
session. `packages/mcp/src/tools-list-budget.test.ts` pins it: per profile
(`readonly`, `standard`, `full`), the tool count exactly and the serialised
byte size against a ceiling in `TOOLS_LIST_BUDGET`. It fails in CI like any
other broken assertion — see [ci.md](./ci.md).

The budgets carry ~5% headroom, which is more than every tool description in
the server put together, so ordinary rewording never trips them. Going over
therefore means something structural changed — a new tool, or a schema that
grew.

**Raising a number in `TOOLS_LIST_BUDGET` is its own commit, and the commit
message says why the extra context is worth paying for.** Never fold a
budget bump into the change that caused it: the whole point of the test is
that growth gets noticed and argued for once, rather than accumulating a
sentence at a time inside unrelated diffs. The same rule applies to the tool
count — adding a tool is a deliberate decision about what every conversation
pays for, not a detail of the commit that implements it.

## Pre-commit

Husky + lint-staged (`.husky/pre-commit`): staged `.ts`/`.tsx`/`.js` files run
through `eslint --fix`; staged `.json`/`.md`/`.yml`/`.css` run through
`prettier --write`. `.husky/commit-msg` runs commitlint.

## Branching

Feature branches (`feat/*`, `fix/*`, `task/*`) → PR → merge to `dev` → merge
to `main` (which triggers release — see [release.md](./release.md)). Merges
are plain GitHub "Merge pull request" commits, not squash or rebase.
