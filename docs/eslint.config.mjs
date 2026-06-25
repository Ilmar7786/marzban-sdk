import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

// Shared house style from the library root (import sort, unused imports,
// Prettier-as-lint). The docs app extends it with Next.js/React rules.
import { sharedStyle } from '../eslint.shared.js'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...sharedStyle,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', '.source/**']),
])

export default eslintConfig
