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
[`packages/sdk`](./packages/sdk); [`packages/mcp`](./packages/mcp) is an MCP
server built on top of it, published to npm and Docker Hub; `packages/cli` is
still an unpublished work-in-progress package; the docs site is
[`apps/docs`](./apps/docs).

```sh
git clone https://github.com/Ilmar7786/marzban-sdk.git
cd marzban-sdk
pnpm install
pnpm build && pnpm test
```

To try changes against a real Marzban panel, `pnpm local:up` starts a
disposable one in Docker — see [`local/README.md`](./local/README.md).

For how the workspace, tests, CI, and releases actually work — task graph,
coverage rules, commit/branch conventions, and why things are built the way
they are — see **[`docs/`](./docs/README.md)**. That's the canonical source;
this file only covers the mechanics of sending a patch.

## Submitting a pull request

1. **Fork** the repository and create a branch:
   ```sh
   git checkout -b feat/your-feature
   ```
2. Make your changes and add or update tests next to the code they cover
   (see [`docs/testing.md`](./docs/testing.md) for coverage requirements).
3. Run `pnpm test` and `pnpm build` — both must pass.
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
   (enforced by commitlint — see [`docs/conventions.md`](./docs/conventions.md)
   for the exact type/scope rules):
   ```
   feat: add pagination to getUsers
   fix: handle missing token in AuthManager
   docs: add NestJS integration example
   ```
   Fixing something in `packages/sdk` that also changes `marzban-mcp`'s
   behavior? Scope it `fix(sdk,mcp): ...` so it surfaces in mcp's changelog
   too — see [`docs/conventions.md`](./docs/conventions.md#commits).
5. Push to your fork and open a PR against the `dev` branch — that's the
   integration branch; it merges into `main` periodically. Both branches
   require the `ci` check to pass before merging (see
   [`docs/adr/0012-gate-dev-with-ci.md`](./docs/adr/0012-gate-dev-with-ci.md)).

## Code style

- All code is **TypeScript** with `strict` mode enabled.
- ESLint + Prettier enforce style — run `pnpm lint` before committing.
- Avoid `any` — prefer proper generics or `unknown`.
- Comments explain _why_, not _what_, and only when it's non-obvious.

## Questions

Start a discussion in [GitHub Discussions](https://github.com/Ilmar7786/marzban-sdk/discussions)
or open an issue.
