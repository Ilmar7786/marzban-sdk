/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,ts,md,json}': 'prettier --write',
  // '*.ts': 'eslint --fix',
}
