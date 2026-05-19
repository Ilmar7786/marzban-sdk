import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  minify: false,
  sourcemap: true,
  splitting: false,
  clean: true,
  treeshake: true,
  target: 'esnext',
  shims: true,
})
