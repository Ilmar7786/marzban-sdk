# Contributing to MarzbanSDK

Thank you for your interest in contributing to **MarzbanSDK**! All contributions
are welcome — bug fixes, features, documentation improvements, and test coverage.

## Reporting issues

Open an [issue](https://github.com/Ilmar7786/marzban-sdk/issues) and include:

- A clear description of the problem.
- Steps to reproduce (code snippet or minimal repo link preferred).
- Expected vs. actual behaviour.
- SDK version (`npm list marzban-sdk`).

## Development setup

This is a monorepo managed with [pnpm workspaces](https://pnpm.io/workspaces)
and [Turborepo](https://turbo.build/repo). The SDK lives in
[`packages/sdk`](./packages/sdk); `packages/cli` and `packages/mcp` are
unpublished work-in-progress packages built on top of it; the docs site is
[`apps/docs`](./apps/docs).

```sh
git clone https://github.com/Ilmar7786/marzban-sdk.git
cd marzban-sdk
pnpm install
```

### Available scripts

Run from the repo root — Turborepo fans these out to every package (or scope
one with `--filter`, e.g. `pnpm turbo run test --filter=marzban-sdk`):

| Command                             | Description                                            |
| ----------------------------------- | ------------------------------------------------------ |
| `pnpm build`                        | Compile every package → `dist/` (ESM + CJS)            |
| `pnpm test`                         | Run the full test suite once with Vitest               |
| `pnpm lint`                         | Run ESLint across every package                        |
| `pnpm format`                       | Format the codebase with Prettier                      |
| `pnpm --filter marzban-sdk codegen` | Regenerate the SDK API client from `openapi/` via Kubb |

SDK-specific scripts (`test:watch`, `test:coverage`, `dev`) live in
[`packages/sdk/package.json`](./packages/sdk/package.json) — run them with
`pnpm --filter marzban-sdk <script>`.

## Testing

The SDK is covered by [Vitest](https://vitest.dev). Tests live next to the code
they cover as `packages/sdk/src/**/*.test.ts`.

```sh
pnpm test                                    # run once, every package
pnpm --filter marzban-sdk test:watch         # watch mode while developing
pnpm --filter marzban-sdk test:coverage      # run with a coverage report
```

Hand-written code is held at **100% coverage** — statements, branches, functions
and lines. Generated code (`packages/sdk/src/gen/`, produced from the OpenAPI
spec) and type-only files are excluded from coverage on purpose.

Every feature and bug fix must come with tests, and
`pnpm --filter marzban-sdk test:coverage` must stay green before a PR is merged.

## Submitting a pull request

1. **Fork** the repository and create a branch:
   ```sh
   git checkout -b feat/your-feature
   ```
2. Make your changes and add or update tests in `packages/sdk/src/**/*.test.ts`.
3. Run `pnpm --filter marzban-sdk test:coverage` and `pnpm build` — both must pass.
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
   (enforced by commitlint via a Husky `commit-msg` hook):
   ```
   feat: add pagination to getUsers
   fix: handle missing token in AuthManager
   docs: add NestJS integration example
   ```
5. Push to your fork and open a PR against the `main` branch.

## Commit message format

```
type(scope?): short description

Optional body.

BREAKING CHANGE: description  ← drives the major version bump
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`.

**Scope** (optional but recommended in a monorepo): `sdk`, `cli`, `mcp`, `docs`,
`deps`, `ci`, `release`.

Use `type!` or a `BREAKING CHANGE:` footer for breaking changes.

## Code style

- All code is **TypeScript** with `strict` mode enabled.
- ESLint + Prettier enforce style — run `pnpm lint` before committing.
- Avoid `any` — prefer proper generics or `unknown`.
- Comments explain _why_, not _what_, and only when it's non-obvious.

## Regenerating the API client

The `packages/sdk/src/gen/` directory is auto-generated from the OpenAPI spec —
do **not** edit it by hand:

```sh
# Update the spec in packages/sdk/openapi/ first, then:
pnpm --filter marzban-sdk codegen
```

If you're fixing a bug in a generated file, fix the template or the spec instead.

## Questions

Start a discussion in [GitHub Discussions](https://github.com/Ilmar7786/marzban-sdk/discussions)
or open an issue.
