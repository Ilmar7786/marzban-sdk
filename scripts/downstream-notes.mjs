#!/usr/bin/env node
// Builds the "### 🔗 From marzban-sdk" section that release-mcp.yml feeds into
// git-cliff via --with-tag-message, so an sdk change that alters mcp's
// behaviour shows up in mcp's own changelog. See docs/release.md.
//
// Usage:
//   node scripts/downstream-notes.mjs mcp            print the section (or nothing)
//   node scripts/downstream-notes.mjs mcp --clear     reset the pending-notes file

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [, , pkg, flag] = process.argv
if (pkg !== 'mcp') {
  console.error('Usage: node scripts/downstream-notes.mjs mcp [--clear]')
  process.exit(1)
}

const NOTES_PATH = '.changelog/mcp-downstream.md'
const NOTES_HEADER = `<!--
Pending downstream notes for marzban-mcp's changelog.

Add one bullet per line for an sdk change that alters mcp's behaviour but
can't be marked on the commit itself (already merged, or the effect only
became clear later). scripts/downstream-notes.mjs folds these into the
"### 🔗 From marzban-sdk" section on the next mcp release, then clears this
file. See docs/release.md.
-->
`

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function sdkVersionAt(ref) {
  try {
    const raw = git(['show', `${ref}:packages/sdk/package.json`])
    return JSON.parse(raw).version
  } catch {
    return null
  }
}

if (flag === '--clear') {
  writeFileSync(NOTES_PATH, NOTES_HEADER)
  process.exit(0)
}

const bullets = []

let prevTag = null
try {
  prevTag = git(['describe', '--tags', '--abbrev=0', '--match', 'mcp-v*', 'HEAD'])
} catch {
  // No prior mcp release — nothing to diff against.
}

if (prevTag) {
  const prevSdk = sdkVersionAt(prevTag)
  const curSdk = JSON.parse(readFileSync(join('packages/sdk/package.json'), 'utf8')).version

  if (prevSdk && curSdk !== prevSdk) {
    bullets.push(
      `- Bundles **marzban-sdk ${curSdk}** (was ${prevSdk}) — see the ` +
        `[SDK release notes](https://github.com/Ilmar7786/marzban-sdk/releases/tag/sdk-v${curSdk}).`
    )
  }

  const subjects = git(['log', `${prevTag}..HEAD`, '--format=%s', '--', 'packages/sdk'])
    .split('\n')
    .filter(Boolean)

  for (const subject of subjects) {
    const match = subject.match(/^(\w+)\(([^)]*)\):\s*(.+)$/)
    if (!match) continue
    const [, type, scopeRaw, description] = match
    if (type === 'docs') continue
    const scopes = scopeRaw.split(/[,/\\]/).map(s => s.trim())
    if (scopes.includes('sdk') && scopes.includes('mcp')) {
      bullets.push(`- ${description}`)
    }
  }
}

try {
  const notes = readFileSync(NOTES_PATH, 'utf8')
  let inComment = false
  for (const line of notes.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('<!--')) {
      inComment = true
      continue
    }
    if (trimmed.endsWith('-->')) {
      inComment = false
      continue
    }
    if (!inComment && trimmed) {
      bullets.push(trimmed)
    }
  }
} catch {
  // No pending-notes file yet.
}

if (bullets.length > 0) {
  console.log(`### 🔗 From marzban-sdk\n\n${bullets.join('\n')}`)
}
