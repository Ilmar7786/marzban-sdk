#!/usr/bin/env node
// Replaces `workspace:*` protocol dependencies in a package's package.json
// with the real published version range, so `npm publish` doesn't ship a
// manifest npm can't install from outside the workspace. Run only in CI,
// right before publish — the change is never committed back to git.
//
// Usage: node scripts/resolve-workspace-deps.mjs <package-dir>

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [, , packageDir] = process.argv
if (!packageDir) {
  console.error('Usage: node scripts/resolve-workspace-deps.mjs <package-dir>')
  process.exit(1)
}

const pkgPath = join(packageDir, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

function resolveVersion(depName) {
  const depPath = join('packages', depName.replace(/^marzban-/, ''), 'package.json')
  const depPkg = JSON.parse(readFileSync(depPath, 'utf8'))
  return depPkg.version
}

let changed = false
for (const field of ['dependencies', 'peerDependencies']) {
  const deps = pkg[field]
  if (!deps) continue
  for (const [name, range] of Object.entries(deps)) {
    if (!range.startsWith('workspace:')) continue
    const protocolRange = range.slice('workspace:'.length)
    const version = resolveVersion(name)
    const resolved =
      protocolRange === '*' || protocolRange === '~' || protocolRange === '^'
        ? `${protocolRange === '*' ? '' : protocolRange}${version}`
        : protocolRange
    deps[name] = resolved
    changed = true
    console.log(`${name}: workspace:${protocolRange} -> ${resolved}`)
  }
}

if (changed) {
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}
