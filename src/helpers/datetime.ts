// helpers: datetime utilities (no filepath)
export interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

/** Add duration components to a Date (immutable) */
export function addToDate(
  date: Date | string | number,
  opts: { days?: number; hours?: number; minutes?: number; seconds?: number; ms?: number }
): Date {
  const d = new Date(date)
  let ms = d.getTime()
  ms += (opts.days ?? 0) * 24 * 3600 * 1000
  ms += (opts.hours ?? 0) * 3600 * 1000
  ms += (opts.minutes ?? 0) * 60 * 1000
  ms += (opts.seconds ?? 0) * 1000
  ms += opts.ms ?? 0
  return new Date(ms)
}

/** Add days */
export function addDays(date: Date | string | number, days: number): Date {
  return addToDate(date, { days })
}

/** Add hours */
export function addHours(date: Date | string | number, hours: number): Date {
  return addToDate(date, { hours })
}

/** Get remaining time from `from` (default now) to `to` */
export function remainingTime(to: Date | string | number, from: Date | string | number = Date.now()): Remaining {
  const t = new Date(to).getTime()
  const f = new Date(from).getTime()
  const delta = Math.max(0, t - f)
  let ms = delta
  const days = Math.floor(ms / (24 * 3600 * 1000))
  ms -= days * 24 * 3600 * 1000
  const hours = Math.floor(ms / (3600 * 1000))
  ms -= hours * 3600 * 1000
  const minutes = Math.floor(ms / (60 * 1000))
  ms -= minutes * 60 * 1000
  const seconds = Math.floor(ms / 1000)
  return { days, hours, minutes, seconds, totalMs: delta }
}

/** Human readable remaining: "2d 5h 3m" */
export function humanRemaining(to: Date | string | number, from?: Date | string | number): string {
  const r = remainingTime(to, from)
  if (r.totalMs <= 0) return 'expired'
  const parts = []
  if (r.days) parts.push(`${r.days}d`)
  if (r.hours) parts.push(`${r.hours}h`)
  if (r.minutes) parts.push(`${r.minutes}m`)
  if (r.seconds && parts.length === 0) parts.push(`${r.seconds}s`) // show seconds only if no other part
  return parts.join(' ')
}

/** Format ISO without milliseconds */
export function toIso(date: Date | string | number): string {
  return new Date(date).toISOString().replace(/\.\d{3}Z$/, 'Z')
}
