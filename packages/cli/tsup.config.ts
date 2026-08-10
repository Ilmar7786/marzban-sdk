import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  minify: false,
  sourcemap: true,
  splitting: false,
  clean: true,
  treeshake: true,
  target: 'esnext',
  shims: true,
  banner: { js: '#!/usr/bin/env node' },
})
