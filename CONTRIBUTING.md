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

```sh
git clone https://github.com/Ilmar7786/marzban-sdk.git
cd marzban-sdk
npm install
```

### Available scripts

| Command                 | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `npm run build`         | Compile TypeScript → `dist/` (ESM + CJS)           |
| `npm test`              | Run the full test suite once with Vitest           |
| `npm run test:watch`    | Run tests in watch mode                            |
| `npm run test:coverage` | Run tests with a coverage report                   |
| `npm run lint`          | Run ESLint (auto-fix)                              |
| `npm run format`        | Format the codebase with Prettier                  |
| `npm run codegen`       | Regenerate the API client from `openapi/` via Kubb |

## Testing

The SDK is covered by [Vitest](https://vitest.dev). Tests live next to the code
they cover as `src/**/*.test.ts`.

```sh
npm test              # run once
npm run test:watch    # watch mode while developing
npm run test:coverage # run with a coverage report
```

Hand-written code is held at **100% coverage** — statements, branches, functions
and lines. Generated code (`src/gen/`, produced from the OpenAPI spec) and
type-only files are excluded from coverage on purpose.

Every feature and bug fix must come with tests, and `npm run test:coverage` must
stay green before a PR is merged.

## Submitting a pull request

1. **Fork** the repository and create a branch:
   ```sh
   git checkout -b feat/your-feature
   ```
2. Make your changes and add or update tests in `src/**/*.test.ts`.
3. Run `npm run test:coverage` and `npm run build` — both must pass.
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

Use `type!` or a `BREAKING CHANGE:` footer for breaking changes.

## Code style

- All code is **TypeScript** with `strict` mode enabled.
- ESLint + Prettier enforce style — run `npm run lint` before committing.
- Avoid `any` — prefer proper generics or `unknown`.
- Comments explain _why_, not _what_, and only when it's non-obvious.

## Regenerating the API client

The `src/gen/` directory is auto-generated from the OpenAPI spec — do **not**
edit it by hand:

```sh
# Update the spec in openapi/ first, then:
npm run codegen
```

If you're fixing a bug in a generated file, fix the template or the spec instead.

## Questions

Start a discussion in [GitHub Discussions](https://github.com/Ilmar7786/marzban-sdk/discussions)
or open an issue.
