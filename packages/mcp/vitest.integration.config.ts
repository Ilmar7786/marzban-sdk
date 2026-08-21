import { defineConfig } from 'vitest/config'

// Mirrors packages/sdk/vitest.integration.config.ts — see that file's
// comments. Kept out of the default `test`/`test:coverage` scripts and the
// 100%-coverage threshold; see docs/testing.md "Integration".
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/integration/**/*.integration.test.ts'],
    env: { NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    testTimeout: 20_000,
    hookTimeout: 20_000,
    retry: 1,
    fileParallelism: false,
  },
})
