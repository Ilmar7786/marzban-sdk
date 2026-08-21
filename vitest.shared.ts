/**
 * Shared Vitest setup for the workspace packages — the same role
 * eslint.shared.js plays for ESLint (see that file's comments). Imported by
 * each package's vitest.config.ts (unit) and vitest.integration.config.ts
 * (integration), which wrap the returned object in their own `defineConfig`
 * call.
 *
 * No `vitest/config` import here on purpose: pnpm doesn't hoist `vitest`
 * into the workspace root's node_modules (only packages/*\/node_modules have
 * it, since it's a per-package devDependency, unlike the ESLint plugins
 * eslint.shared.js imports, which are root devDependencies). A value import
 * of `vitest/config` from this file resolves only via Vite's "unresolved,
 * treat as external" fallback — a warning-worthy hack, not something to
 * build the shared config on. Plain object literals sidestep the problem
 * entirely; each package's own `defineConfig` (resolved from its own
 * node_modules) validates and types the merged result.
 */

/** Unit tests: mocked transport, 100% coverage on hand-written code. */
export function unitConfig({ coverageExclude = [] }: { coverageExclude?: string[] } = {}) {
  return {
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**'],
        // Barrels and type-only files carry no runtime logic (and compile to
        // empty JS, which v8 cannot remap). `coverageExclude` adds package-
        // specific exclusions — e.g. the SDK's kubb-generated src/gen.
        exclude: ['**/index.ts', '**/types.ts', '**/*.types.ts', ...coverageExclude],
        // Hand-written code is fully covered; keep it that way.
        thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  }
}

/**
 * Integration tests: a real Marzban panel (see local/marzban/), not a mocked
 * transport. Kept out of the default `test`/`test:coverage` scripts and the
 * 100%-coverage threshold — see docs/testing.md "Integration". The panel's
 * self-signed certificate is trusted per-SDK-instance via the `httpsAgent`
 * config option (see each package's test/integration/helpers/tls.ts), not
 * through any process-wide TLS override here.
 */
export function integrationConfig() {
  return {
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['test/integration/**/*.integration.test.ts'],
      testTimeout: 20_000,
      hookTimeout: 20_000,
      retry: 1,
      // All files share one live panel and one admin session — running them
      // concurrently risks cross-file races (e.g. shared username namespace).
      fileParallelism: false,
    },
  }
}
