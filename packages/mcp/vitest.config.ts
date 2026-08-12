import { defineConfig } from 'vitest/config'

export default defineConfig({
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
      exclude: ['**/index.ts', '**/types.ts', '**/*.types.ts'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
})
