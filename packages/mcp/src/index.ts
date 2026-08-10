import { createRequire } from 'node:module'

// Placeholder entry point — the actual MCP server (tools, resources, transport)
// has not been implemented yet. This exists so the package skeleton builds,
// installs, and runs end-to-end as part of the monorepo migration.
const require = createRequire(import.meta.url)
const { name, version } = require('../package.json') as { name: string; version: string }

console.log(`${name} v${version} — not implemented yet`)
