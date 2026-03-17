// helpers: bytes utilities
export type SizeUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB'

/**
 * Parse human size like "1.5GB", "1024", "2 mb" into bytes (number).
 * Default uses binary units (KB = 1024). Pass { decimal: true } to use 1000.
 */
export function parseSize(size: string | number, opts?: { decimal?: boolean }): number {
  if (typeof size === 'number' && Number.isFinite(size)) return Math.round(size)
  if (!size || typeof size !== 'string') return 0
  const s = size.trim().toUpperCase()
  // FIX: added PIB/PB to the regex so petabyte strings are parsed correctly
  const m = /^([+-]?\d+(?:[.,]\d+)?)\s*(B|KB|KIB|MB|MIB|GB|GIB|TB|TIB|PB|PIB)?$/.exec(s)
  if (!m) return 0
  const raw = parseFloat(m[1].replace(',', '.'))
  const rawUnit = (m[2] || 'B').toUpperCase()
  // normalize variants: KIB -> KB, MIB -> MB, GIB -> GB, TIB -> TB, PIB -> PB
  const unit = rawUnit.replace(/IB$/, 'B') as SizeUnit
  const base = opts?.decimal ? 1000 : 1024
  switch (unit) {
    case 'B':
      return Math.round(raw)
    case 'KB':
      return Math.round(raw * Math.pow(base, 1))
    case 'MB':
      return Math.round(raw * Math.pow(base, 2))
    case 'GB':
      return Math.round(raw * Math.pow(base, 3))
    case 'TB':
      return Math.round(raw * Math.pow(base, 4))
    case 'PB':
      return Math.round(raw * Math.pow(base, 5))
  }
}

/**
 * Format bytes to human string like "1.50 GB".
 * - decimal=true uses 1000, otherwise 1024.
 */
export function formatBytes(bytes: number, opts?: { decimals?: number; decimal?: boolean }): string {
  const decimals = opts?.decimals ?? 2
  const decimal = !!opts?.decimal
  if (!Number.isFinite(bytes)) return '0 B'
  const base = decimal ? 1000 : 1024
  const absBytes = Math.abs(bytes)
  if (absBytes < base) return `${Math.round(bytes)} B`
  // overflowing as "1024.00 TB"
  const units = ['KB', 'MB', 'GB', 'TB', 'PB']
  let i = -1
  let value = absBytes
  while (value >= base && i < units.length - 1) {
    value /= base
    i++
  }
  const sign = bytes < 0 ? '-' : ''
  return `${sign}${value.toFixed(decimals)} ${units[i]}`
}

/** Convert GB -> bytes */
export function gbToBytes(gb: number, decimal = false): number {
  const base = decimal ? 1000 : 1024
  return Math.round(gb * Math.pow(base, 3))
}

/** Convert bytes -> GB (float) */
export function bytesToGb(bytes: number, decimal = false): number {
  const base = decimal ? 1000 : 1024
  return bytes / Math.pow(base, 3)
}
