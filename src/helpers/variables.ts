/**
 * Helper utilities for working with Marzban host-settings template variables.
 *
 * Official reference (Host Settings -> Variables):
 * https://gozargah.github.io/marzban/en/docs/host-settings
 *
 * This module exports:
 * - Variable: enum of supported variable names (without braces)
 * - varAs: format a Variable as a template token ("{NAME}")
 * - Braced: a frozen map of pre-wrapped tokens for quick use
 * - varExtract: extract variable names from a template
 * - varValidate: validate a template against known variables
 * - formatTemplate: substitute values into a template
 *
 * Note: API is intentionally simple and does not preserve legacy/compatibility shims.
 */

/**
 * Enumeration of supported Marzban template variables.
 *
 * Each entry is the variable name (without braces) used in templates like "{USERNAME}".
 *
 * @see https://gozargah.github.io/marzban/en/docs/host-settings
 */
export enum Variable {
  /** Master server IPv4 address, use as "{SERVER_IP}". */
  SERVER_IP = 'SERVER_IP',

  /** User username/login, use as "{USERNAME}". */
  USERNAME = 'USERNAME',

  /** Amount of data consumed by the user, use as "{DATA_USAGE}". */
  DATA_USAGE = 'DATA_USAGE',

  /** Remaining data for the user, use as "{DATA_LEFT}". */
  DATA_LEFT = 'DATA_LEFT',

  /** Total data limit for the user, use as "{DATA_LIMIT}". */
  DATA_LIMIT = 'DATA_LIMIT',

  /** Remaining days of subscription (integer), use as "{DAYS_LEFT}". */
  DAYS_LEFT = 'DAYS_LEFT',

  /** Human-friendly remaining time (days/hours/mins/secs), use as "{TIME_LEFT}". */
  TIME_LEFT = 'TIME_LEFT',

  /** Expiration date in Gregorian calendar, use as "{EXPIRE_DATE}". */
  EXPIRE_DATE = 'EXPIRE_DATE',

  /** Expiration date in Jalali calendar, use as "{JALALI_EXPIRE_DATE}". */
  JALALI_EXPIRE_DATE = 'JALALI_EXPIRE_DATE',

  /** User status as an emoji (e.g. ✅, ⌛️, ❌), use as "{STATUS_EMOJI}". */
  STATUS_EMOJI = 'STATUS_EMOJI',

  /** Configuration protocol (vless, vmess, trojan, shadowsocks, ...), use as "{PROTOCOL}". */
  PROTOCOL = 'PROTOCOL',

  /** Transport type (tcp, ws, grpc, ...), use as "{TRANSPORT}". */
  TRANSPORT = 'TRANSPORT',
}

/**
 * Result of validating template variables.
 *
 * - isValid: true when no unknown variables were found.
 * - unknownVariables: list of variable names (without braces) that are not in {@link Variable}.
 */
export interface TemplateVariablesValidationResult {
  /** True when template contains only known variables. */
  isValid: boolean

  /** Unknown variable names found in the template (without braces). */
  unknownVariables: string[]
}

/**
 * Return a variable formatted as a template token, e.g. "{USERNAME}".
 *
 * @param v Variable enum member.
 * @returns String token ready for insertion into templates.
 *
 * @example
 * varAs(Variable.USERNAME) // "{USERNAME}"
 */
export function varAs(v: Variable): string {
  return `{${v}}`
}

/**
 * Frozen map of pre-braced tokens for quick insertion.
 *
 * Usage: VariableBraced.USERNAME === "{USERNAME}"
 */
export const VariableBraced = Object.freeze(
  Object.fromEntries(Object.values(Variable).map(v => [v, `{${v}}`])) as { [K in Variable]: string }
)

/**
 * Extract variable names from a template string.
 *
 * Matches tokens in the form "{NAME}" where NAME matches \w+ (letters, digits, underscore).
 * Returned names do not include braces and preserve the order of appearance.
 *
 * @param template Template string to scan.
 * @returns Array of variable names (without braces). Empty array when none found or template falsy.
 *
 * @example
 * varExtract("hello {USERNAME}, ip: {SERVER_IP}") // ["USERNAME", "SERVER_IP"]
 */
export function varExtract(template: string): string[] {
  if (!template) return []
  const matches = template.match(/\{(\w+?)\}/g) || []
  return matches.map(m => m.slice(1, -1))
}

/**
 * Validate that a template string contains only known Marzban variables.
 *
 * Unknown variables (not present in {@link Variable}) are returned in unknownVariables.
 *
 * @param template Template string to validate.
 * @returns {@link TemplateVariablesValidationResult}
 *
 * @example
 * varValidate("hi {USERNAME} and {FOO}")
 * // { isValid: false, unknownVariables: ["FOO"] }
 */
export function varValidate(template: string): TemplateVariablesValidationResult {
  const vars = varExtract(template)
  const known = new Set(Object.values(Variable))
  const unknown = vars.filter(v => !known.has(v as Variable))
  return {
    isValid: unknown.length === 0,
    unknownVariables: unknown,
  }
}

/**
 * Interpolate known Marzban template variables inside a template string.
 *
 * Replaces tokens like "{USERNAME}" with provided values. Only keys present
 * in the `values` map (keys are {@link Variable}) are substituted. Unknown or
 * missing values are left intact.
 *
 * @param template Template containing tokens such as "{USERNAME}".
 * @param values Partial mapping from {@link Variable} to replacement strings.
 * @returns New string with substitutions applied.
 *
 * @example
 * interpolateTemplateVariables("hi {USERNAME}, left: {DATA_LEFT}", {
 *   [Variable.USERNAME]: "alice",
 *   [Variable.DATA_LEFT]: "10GB"
 * })
 * // "hi alice, left: 10GB"
 */
export function interpolateTemplateVariables(template: string, values: Partial<Record<Variable, string>>): string {
  if (!template) return template
  return template.replace(/\{(\w+?)\}/g, (match, name: string) => {
    const key = name as Variable
    return values && values[key] != null ? String(values[key]) : match
  })
}
