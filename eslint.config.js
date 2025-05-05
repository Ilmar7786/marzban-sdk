import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import prettierPlugin from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['**/dist'],
  },
  { files: ['**/*.{js,mjs,cjs,ts}'], plugins: { js }, extends: ['js/recommended'] },
  { files: ['**/*.{js,mjs,cjs,ts}'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      prettier: prettierPlugin,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'prettier/prettier': 'error',
    },
  },
  eslintConfigPrettier,
])
