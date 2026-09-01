#!/usr/bin/env node
// Mirrors the vendored, hand-patched OpenAPI spec from packages/sdk into
// apps/docs/public, so the "Download openapi.json" link on the OpenAPI Spec
// page has a file to serve. That's this script's only job — the page itself
// (src/lib/openapi.ts) reads packages/sdk/openapi/openapi.json directly, not
// this copy, so `dev`/`types:check` never depend on it having run.
// Source of truth stays packages/sdk/openapi/openapi.json.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE = join(__dirname, '../../../packages/sdk/openapi/openapi.json')
const DEST = join(__dirname, '../public/openapi.json')

if (!existsSync(SOURCE)) {
  console.error(`[sync-openapi] spec not found at ${SOURCE}.`)
  console.error('[sync-openapi] this script mirrors packages/sdk/openapi/openapi.json — check it out first.')
  process.exit(1)
}

mkdirSync(dirname(DEST), { recursive: true })
copyFileSync(SOURCE, DEST)
console.log(`[sync-openapi] ${SOURCE} -> ${DEST}`)
