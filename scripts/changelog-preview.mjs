#!/usr/bin/env node
// Local preview of what release-prepare would generate for a package's
// CHANGELOG.md, without waiting for CI. Mirrors the mode selection in
// .github/actions/release-prepare/action.yml — the --unreleased/--latest
// choice and the empty-render guard — because a naive
// `git-cliff --unreleased --prepend` run against a package whose current
// version is already tagged (the common case right after a release) writes
// a bogus, content-free "## [<tag>] - <today>" section into CHANGELOG.md.
// On top of that, this script (unlike CI) also has to handle being run at
// any time, not just during a genuine force_publish resume, so it checks
// whether the tag's section is already in the file before falling back to
// --latest. See docs/adr/0014-git-cliff-unreleased-not-latest.md.
//
// Usage:
//   node scripts/changelog-preview.mjs <package-dir> <tag-prefix> <tag-pattern> [--with-tag-message <text>]
//   node scripts/changelog-preview.mjs packages/sdk sdk-v '^(sdk-)?v[0-9].*'

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const [, , packageDir, tagPrefix, tagPattern, ...rest] = process.argv
if (!packageDir || !tagPrefix || !tagPattern) {
  console.error(
    'Usage: node scripts/changelog-preview.mjs <package-dir> <tag-prefix> <tag-pattern> [--with-tag-message <text>]'
  )
  process.exit(1)
}

let tagMessageArgs = []
const tagMessageFlagIndex = rest.indexOf('--with-tag-message')
if (tagMessageFlagIndex !== -1) {
  const message = (rest[tagMessageFlagIndex + 1] ?? '').trim()
  if (message) tagMessageArgs = ['--with-tag-message', message]
}

const version = JSON.parse(readFileSync(`${packageDir}/package.json`, 'utf8')).version
const tag = `${tagPrefix}${version}`

function tagExists(name) {
  try {
    execFileSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${name}`], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// --unreleased is correct once this version's tag doesn't exist yet — the
// normal case for a preview run before release-sdk.yml/release-mcp.yml has
// created it. If it already exists (you're previewing right after a real
// release), --latest correctly resolves to that same tag instead of
// manufacturing an empty "unreleased" section — but unlike CI's
// force_publish resume (which only takes this path when CHANGELOG.md is
// known not to have the entry yet), a local preview run has no such
// guarantee: the file may well already document this exact tag, and
// blindly prepending would duplicate it. Check for that case explicitly.
const changelogPath = `${packageDir}/CHANGELOG.md`
const resuming = tagExists(tag)
if (resuming) {
  const changelog = readFileSync(changelogPath, 'utf8')
  if (changelog.includes(`## [${tag}]`)) {
    console.error(`${tag} is already documented in ${changelogPath} — nothing to preview.`)
    process.exit(0)
  }
}
const mode = resuming ? '--latest' : '--unreleased'

const cliffArgs = [
  '--tag',
  tag,
  '--tag-pattern',
  tagPattern,
  '--include-path',
  `${packageDir}/**`,
  ...tagMessageArgs,
  mode,
]

const rendered = execFileSync('pnpm', ['exec', 'git-cliff', ...cliffArgs, '--strip', 'all'], {
  encoding: 'utf8',
})

if (!/^- /m.test(rendered)) {
  console.error(`No changelog-worthy commits for ${tag} yet — ${changelogPath} left untouched.`)
  process.exit(0)
}

execFileSync('pnpm', ['exec', 'git-cliff', ...cliffArgs, '--prepend', changelogPath], {
  stdio: 'inherit',
})
