const DURATION_PATTERN = /^(\d+)\s*(s|m|h|d)$/i

const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
}

/** Whether `input` matches the relative-duration shape ("30d", "12h", "45m", "90s") — for schema-level validation before `parseDurationMs` is called. */
export function isDurationString(input: string): boolean {
  return DURATION_PATTERN.test(input.trim())
}

/** Parses a relative duration ("30d", "12h", "45m", "90s") into milliseconds. @throws if `input` doesn't match the expected shape — callers should validate with `isDurationString` first when they want a typed error instead. */
export function parseDurationMs(input: string): number {
  const match = DURATION_PATTERN.exec(input.trim())
  if (!match) {
    throw new Error(`Invalid duration "${input}" — expected a number followed by s/m/h/d, e.g. "30d", "12h", "45m".`)
  }
  const [, amount, unit] = match
  return Number(amount) * UNIT_MS[unit.toLowerCase()]
}
