export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // A comma-separated scope like `fix(sdk,mcp): ...` is valid as-is — each
    // scope in the list is checked against this enum individually. Used to
    // mark an sdk commit that also changes mcp's behavior, so it surfaces in
    // mcp's changelog too (see docs/release.md, scripts/downstream-notes.mjs).
    'scope-enum': [2, 'always', ['sdk', 'cli', 'mcp', 'docs', 'deps', 'ci', 'release', 'changelog']],
  },
}
