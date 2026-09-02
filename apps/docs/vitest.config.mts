import { defineConfig } from 'vitest/config'

import { unitConfig } from '../../vitest.shared.ts'

// `.mts` rather than the `.ts` the other packages use: apps/docs is a Next.js
// app without `"type": "module"` (Next resolves its own config files by
// extension, so adding it here is not free), and Vite's native config loader
// warns about ESM syntax in a file it has to load as CommonJS. The extension
// also keeps this file out of `tsc --noEmit` — same as the sdk/mcp configs,
// which sit outside their packages' `include`; Vitest resolves it itself.

// The docs app has one unit-tested module — lib/changelog.ts, which parses the
// git-cliff CHANGELOG.md files the Changelog page renders. Everything else here
// is pages and components covered by `types:check` and the production build,
// so the shared 100%-coverage threshold is deliberately not wired up (there's
// no `test:coverage` script for this package).
export default defineConfig(unitConfig())
