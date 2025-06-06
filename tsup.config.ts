import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  minify: true,
  sourcemap: true,
  splitting: false,
  clean: true,
  treeshake: true,
  target: 'esnext',
  shims: true,
})
