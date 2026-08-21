# Workspace

**Covers:** pnpm workspace setup, Turborepo task graph, TypeScript config,
running things locally.
**Excludes:** lint/format/commit rules (see [conventions.md](./conventions.md)),
what CI actually runs (see [ci.md](./ci.md)).
**Next:** [conventions.md](./conventions.md).

## Package manager

pnpm workspaces (`pnpm-workspace.yaml`: `packages/*`, `apps/*`), pinned via
`packageManager` in the root `package.json` — pnpm 11. `engine-strict=true`
in `.npmrc` enforces `node >= 24`.

`onlyBuiltDependencies` in `pnpm-workspace.yaml` allowlists native postinstall
scripts (`esbuild`, `sharp`, `@tailwindcss/oxide`, `git-cliff`, …) — pnpm 10+
blocks postinstall scripts by default, and without this list tsup and Next.js
fail to install correctly.

```sh
pnpm install
```

## Turborepo

`turbo.json` declares five tasks:

| Task          | `dependsOn` | Cached              |
| ------------- | ----------- | ------------------- |
| `build`       | `^build`    | yes                 |
| `lint`        | —           | yes                 |
| `test`        | `^build`    | yes                 |
| `types:check` | `^build`    | yes                 |
| `codegen`     | —           | no (`cache: false`) |

`^build` means "build this package's workspace dependencies first" — that's
what makes `apps/docs` wait for `packages/sdk` to build. There's no `dev`
task declared, even though the root `pnpm dev` script calls `turbo run dev` —
know that `pnpm dev` currently has nothing to fan out to at the root; run a
package's own `dev` script directly instead (see below).

Scope any task to one package with `--filter`:

```sh
pnpm turbo run test --filter=marzban-sdk
pnpm turbo run build --filter=marzban-mcp
```

Cache is local, under `.turbo/cache/`. Delete it to force a clean re-run.

## TypeScript

`tsconfig.base.json` is the shared root: `strict`, `target: ES2018`,
`moduleResolution: bundler`, `emitDeclarationOnly`, `noUnusedLocals`,
`noUnusedParameters`. Each of `packages/{sdk,cli,mcp}/tsconfig.json` extends
it and adds `paths: { "@/*": ["src/*"] }`. `apps/docs/tsconfig.json` is
self-contained (Next.js's own conventions) and does not extend the base.

**There are no TypeScript project references between packages.**
Cross-package type resolution goes through `workspace:^` + Turborepo's
`^build` ordering, not `tsconfig` references — deliberately, to keep each
package's `tsconfig.json` simple and avoid coupling build order to the
TypeScript compiler.

## Bundlers

| Package       | Bundler                         | Output                               |
| ------------- | ------------------------------- | ------------------------------------ |
| `marzban-sdk` | tsup, dual ESM+CJS, `dts: true` | `dist/index.{js,cjs}` + declarations |
| `marzban-mcp` | tsup, ESM only, shebang banner  | `dist/index.js` (bin)                |
| `marzban-cli` | tsup, ESM only, shebang banner  | `dist/index.js` (bin)                |
| `apps/docs`   | Next.js static export           | `out/`                               |

`marzban-sdk`'s spec generation (`kubb generate`, wired as the `codegen`
script) is documented in
[`packages/sdk/ARCHITECTURE.md`](../packages/sdk/ARCHITECTURE.md) —
it's not a Turborepo-cached task and must be run explicitly after editing the
OpenAPI spec.

## Root scripts

`build`, `dev`, `lint`, `test`, `types:check` all fan out via
`turbo run <task>`. `format`/`format:check` run Prettier directly across the
whole repo (not per-package, not through Turborepo). `local:up`/`local:down`/
`local:logs`/`local:reset` wrap the Docker stand in `local/marzban/` (below)
— not Turborepo tasks either, there's nothing to cache.

## Local Marzban panel

`local/marzban/` is a disposable Marzban panel in Docker for manually
exercising `marzban-sdk`/`marzban-mcp` against a real panel — not part of the
test suite (see [testing.md](./testing.md#network-isolation)). Start it with
`pnpm local:up`; see [`local/marzban/README.md`](../local/marzban/README.md)
for the rest.
