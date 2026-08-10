export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['sdk', 'cli', 'mcp', 'docs', 'deps', 'ci', 'release', 'changelog']],
  },
}
