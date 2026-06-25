import eslintConfigPrettier from 'eslint-config-prettier/flat'
import prettierPlugin from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'

/**
 * Shared house style: import sorting, unused-import pruning, and Prettier-as-lint.
 *
 * Single source of truth — imported by the library root config (`eslint.config.js`)
 * and by `docs/eslint.config.mjs`, which extends it with Next.js/React rules.
 * Plugins resolve from the root `node_modules`, so consumers don't re-install them.
 */
export const sharedStyle = [
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      prettier: prettierPlugin,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': 'error',
    },
  },
  // Must stay last: turns off ESLint rules that conflict with Prettier.
  eslintConfigPrettier,
]
