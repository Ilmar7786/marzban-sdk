/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,mjs,cjs,ts,tsx,jsx}': 'eslint --fix',
  // MDX is intentionally excluded here — see the note in .prettierignore.
  '*.{json,md,yml,yaml,css}': 'prettier --write',
}
