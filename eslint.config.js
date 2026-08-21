import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { sharedStyle } from './eslint.shared.js'

export default defineConfig([
  {
    // The docs app is a standalone Next.js app; it has its own ESLint config that
    // extends the shared house style (see eslint.shared.js).
    ignores: ['**/dist', 'apps/docs'],
  },
  { files: ['**/*.{js,mjs,cjs,ts}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,mjs,cjs,ts}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  tseslint.configs.recommended,
  ...sharedStyle,
  {
    // Matched with a leading `**/` (rather than `packages/sdk/src/gen/**`)
    // because this file is also invoked with `-c` from within
    // packages/sdk (see the kubb `done` hook) — ESLint resolves `files`
    // patterns relative to the current working directory, not the config
    // file's location, so a root-anchored pattern would miss that case.
    files: ['**/src/gen/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])
