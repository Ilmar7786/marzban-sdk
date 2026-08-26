#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const [, , serverPath, version] = process.argv

if (!serverPath || !version) {
  console.error('Usage: node scripts/prepare-mcp-registry.mjs <server.json> <version>')
  process.exit(1)
}

const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

if (!semverPattern.test(version)) {
  console.error(`Invalid version: "${version}"`)
  process.exit(1)
}

const source = await readFile(serverPath, 'utf8')
const server = JSON.parse(source)

if (!server.name) {
  throw new Error('server.json: "name" is required')
}

if (!server.packages || !Array.isArray(server.packages)) {
  throw new Error('server.json: "packages" must be an array')
}

const npmPackages = server.packages.filter(pkg => pkg.registryType === 'npm')

if (npmPackages.length === 0) {
  throw new Error('server.json: no npm package found')
}

for (const pkg of npmPackages) {
  if (!pkg.identifier) {
    throw new Error('server.json: npm package identifier is required')
  }

  if (pkg.identifier !== 'marzban-mcp') {
    throw new Error(`server.json: unexpected npm package "${pkg.identifier}"`)
  }
}

const ociPackages = server.packages.filter(pkg => pkg.registryType === 'oci')

for (const pkg of ociPackages) {
  if (!pkg.identifier) {
    throw new Error('server.json: OCI package identifier is required')
  }

  pkg.identifier = `docker.io/ilmar7786/marzban-mcp:${version}`
}

server.version = version

for (const pkg of npmPackages) {
  pkg.version = version
}

await writeFile(serverPath, `${JSON.stringify(server, null, 2)}\n`, 'utf8')

console.log('Prepared MCP Registry manifest:')
console.log(`  file:    ${serverPath}`)
console.log(`  name:    ${server.name}`)
console.log(`  version: ${server.version}`)

for (const pkg of npmPackages) {
  console.log(`  npm:     ${pkg.identifier}@${pkg.version}`)
}

for (const pkg of ociPackages) {
  console.log(`  oci:     ${pkg.identifier}`)
}
