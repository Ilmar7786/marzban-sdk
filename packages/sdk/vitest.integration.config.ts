import { defineConfig } from 'vitest/config'

// Separate from vitest.config.ts on purpose: these tests hit a real Marzban
// panel (see local/marzban/), not a mocked transport. Kept out of the
// default `test`/`test:coverage` scripts and the 100%-coverage threshold —
// see docs/testing.md "Integration".
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/integration/**/*.integration.test.ts'],
    // The panel's local/marzban/gen-cert.sh certificate is self-signed —
    // the SDK has no config option to supply a custom CA/httpsAgent, so
    // this is the only way to talk to it. Scoped to this integration-only
    // process; never set in vitest.config.ts (the mocked unit-test run).
    env: { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    testTimeout: 20_000,
    hookTimeout: 20_000,
    retry: 1,
    // All files share one live panel and one admin session — running them
    // concurrently risks cross-file races (e.g. shared username namespace).
    fileParallelism: false,
  },
})
