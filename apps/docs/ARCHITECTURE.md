# `apps/docs` architecture

**Covers:** how the documentation site is built and deployed, where content
lives, its (lack of a) link to the code it documents.
**Excludes:** how to write a docs page — see Fumadocs' own docs for that;
release/deploy mechanics — see [`docs/release.md`](../../docs/release.md).
**Next:** [`docs/architecture.md`](../../docs/architecture.md) for why this
package only ever appears in `devDependencies`.

## Purpose and boundary

The public documentation site for `marzban-sdk` and `marzban-mcp` — usage
guides, configuration reference, API surface descriptions. Consumer-facing
only; nothing here is read by the other packages.

## Stack

Next.js 16 (App Router) + [Fumadocs](https://fumadocs.dev) (`fumadocs-core`,
`fumadocs-ui`, `fumadocs-mdx`), Tailwind CSS v4. Content is MDX under
`content/docs/**`, one `meta.json` per section controlling page order; the
top-level section order lives in `content/docs/meta.json`. `source.config.ts`
defines the MDX collection schema; `fumadocs-mdx` compiles it into `.source/`
via the package's `postinstall` script.

## Layout of `src/`

Four layers, each with one job:

- `src/config/` — static data and copy (`.ts`, no JSX; a `LucideIcon` value in
  a data object is fine, a component is not). Landing page text lives here
  (`config/landing/`), not in the route file — edit `features.ts`/`modules.ts`
  etc. to change what the landing page says.
- `src/lib/` — plain logic and shared constants, no React.
- `src/components/` — presentation only. Data arrives as props or is imported
  from `config/`, split into `ui/` (generic primitives reused across landing
  and docs), `landing/` (landing-only pieces, section components under
  `landing/sections/`), and `docs/` (docs-only pieces).
- `src/app/` — routes: metadata, layout wiring, composing the above. A page
  under `app/` should read as a list of section components, not contain their
  markup.

Styles follow the same split: `src/app/global.css` is just the Tailwind/
Fumadocs entry `@import`s, the actual rules live in `src/styles/` — one file
per concern (`tokens.css`, `landing.css`, `code-frame.css`, `docs.css`).

Keep files under ~200 lines. When a file grows past that, it's usually doing
more than one of the four jobs above — split along that line first.

## Build and deploy

`next.config.mjs` sets `output: 'export'` (static HTML, no server) and
`trailingSlash: true`. The build emits `apps/docs/out/`, which
`.github/workflows/docs.yml` uploads to GitHub Pages on every push to `main`
that touches `apps/docs/**`.

`basePath` (`'/marzban-sdk'` in production, empty in dev) is defined in both
`next.config.mjs` and `src/lib/shared.ts` — intentionally duplicated, because
`next.config.mjs` can't import runtime application code. If you change one,
change both.

## Relationship to the rest of the repo

`marzban-sdk` is listed under this package's `devDependencies`, but nothing
here imports it. That entry exists solely so Turborepo's `^build` dependency
builds the SDK before the docs site — see
[`docs/architecture.md`](../../docs/architecture.md).

**MDX content is maintained by hand, not generated from code** — with one
exception. The OpenAPI Spec page (`content/docs/openapi/spec.mdx`) renders
`src/components/docs/openapi-viewer.tsx`, which reads
`packages/sdk/openapi/openapi.json` directly (the vendored, hand-patched spec
— see [ADR-0003](../../docs/adr/0003-vendored-openapi-spec.md)) at build time,
so the endpoint list always matches the spec without a separate regeneration
step. `scripts/sync-openapi.mjs` only mirrors that same file into `public/`
for the page's "Download openapi.json" link — the `prebuild` hook runs it
automatically, so a forgotten manual `pnpm sync:openapi` can't ship a stale
download.

`public/openapi.json` is gitignored, so it doesn't exist yet on a fresh
clone. `dev`/`types:check` don't need it (the viewer reads
`packages/sdk/openapi/openapi.json` directly), but the download link 404s in
`next dev` until you run `pnpm sync:openapi` once — `pnpm build` also
produces it, via `prebuild`.

Everything else is still hand-maintained. Two places are the most likely to
drift from the code they describe:

- `content/docs/mcp-server/tools.mdx` — the MCP tool list.
- `src/components/docs/type-glossary.ts` — the SDK type glossary powering
  inline type popovers.

When either the SDK's public API or the MCP tool set changes, update these by
hand alongside the code change.
