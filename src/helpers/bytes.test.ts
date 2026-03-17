import { describe, expect, it } from 'vitest'

import { bytesToGb, formatBytes, gbToBytes, parseSize } from './bytes'

describe('parseSize', () => {
  describe('number input', () => {
    it('returns the number rounded when given a finite number', () => {
      expect(parseSize(1024)).toBe(1024)
    })

    it('rounds float numbers', () => {
      expect(parseSize(1024.7)).toBe(1025)
    })

    it('returns 0 for NaN', () => {
      expect(parseSize(NaN)).toBe(0)
    })

    it('returns 0 for Infinity', () => {
      expect(parseSize(Infinity)).toBe(0)
    })

    it('returns 0 for -Infinity', () => {
      expect(parseSize(-Infinity)).toBe(0)
    })
  })

  describe('invalid / empty string input', () => {
    it('returns 0 for an empty string', () => {
      expect(parseSize('')).toBe(0)
    })

    it('returns 0 for a non-numeric string', () => {
      expect(parseSize('abc')).toBe(0)
    })

    it('returns 0 for a string with only spaces', () => {
      expect(parseSize('   ')).toBe(0)
    })

    it('returns 0 for null-like values cast via unknown', () => {
      expect(parseSize(null as unknown as string)).toBe(0)
    })
  })

  describe('bytes (no unit)', () => {
    it('parses a plain integer string', () => {
      expect(parseSize('1024')).toBe(1024)
    })

    it('parses "B" suffix', () => {
      expect(parseSize('512 B')).toBe(512)
    })

    it('parses with leading/trailing whitespace', () => {
      expect(parseSize('  512  ')).toBe(512)
    })
  })

  describe('KB', () => {
    it('parses "1 KB" in binary (1024)', () => {
      expect(parseSize('1 KB')).toBe(1024)
    })

    it('parses "1 KB" in decimal (1000)', () => {
      expect(parseSize('1 KB', { decimal: true })).toBe(1000)
    })

    it('parses "1 KIB" as KB (binary alias)', () => {
      expect(parseSize('1 KIB')).toBe(1024)
    })

    it('parses lowercase "kb"', () => {
      expect(parseSize('2kb')).toBe(2048)
    })

    it('parses "1.5 KB"', () => {
      expect(parseSize('1.5 KB')).toBe(Math.round(1.5 * 1024))
    })
  })

  describe('MB', () => {
    it('parses "1 MB" in binary', () => {
      expect(parseSize('1 MB')).toBe(1024 ** 2)
    })

    it('parses "1 MB" in decimal', () => {
      expect(parseSize('1 MB', { decimal: true })).toBe(1000 ** 2)
    })

    it('parses "1 MIB" as MB', () => {
      expect(parseSize('1 MIB')).toBe(1024 ** 2)
    })

    it('parses "2.5 MB"', () => {
      expect(parseSize('2.5 MB')).toBe(Math.round(2.5 * 1024 ** 2))
    })
  })

  describe('GB', () => {
    it('parses "1 GB" in binary', () => {
      expect(parseSize('1 GB')).toBe(1024 ** 3)
    })

    it('parses "1 GB" in decimal', () => {
      expect(parseSize('1 GB', { decimal: true })).toBe(1000 ** 3)
    })

    it('parses "1 GIB" as GB', () => {
      expect(parseSize('1 GIB')).toBe(1024 ** 3)
    })
  })

  describe('TB', () => {
    it('parses "1 TB" in binary', () => {
      expect(parseSize('1 TB')).toBe(1024 ** 4)
    })

    it('parses "1 TB" in decimal', () => {
      expect(parseSize('1 TB', { decimal: true })).toBe(1000 ** 4)
    })

    it('parses "1 TIB" as TB', () => {
      expect(parseSize('1 TIB')).toBe(1024 ** 4)
    })
  })

  describe('PB', () => {
    it('parses "1 PB" in binary', () => {
      expect(parseSize('1 PB')).toBe(1024 ** 5)
    })

    it('parses "1 PB" in decimal', () => {
      expect(parseSize('1 PB', { decimal: true })).toBe(1000 ** 5)
    })

    it('parses "1 PIB" as PB', () => {
      expect(parseSize('1 PIB')).toBe(1024 ** 5)
    })
  })

  describe('comma as decimal separator', () => {
    it('parses "1,5 MB" (european format)', () => {
      expect(parseSize('1,5 MB')).toBe(Math.round(1.5 * 1024 ** 2))
    })
  })

  describe('sign', () => {
    it('parses a negative value', () => {
      expect(parseSize('-1 KB')).toBe(-1024)
    })

    it('parses an explicitly positive value', () => {
      expect(parseSize('+1 KB')).toBe(1024)
    })
  })

  describe('unit normalization edge cases', () => {
    it('"B" unit is not mangled by the normalizer', () => {
      expect(parseSize('100 B')).toBe(100)
    })

    it('"TB" is not mangled by the normalizer (ends in B, no I)', () => {
      expect(parseSize('1 TB')).toBe(1024 ** 4)
    })
  })
})

describe('formatBytes', () => {
  describe('edge cases', () => {
    it('returns "0 B" for NaN', () => {
      expect(formatBytes(NaN)).toBe('0 B')
    })

    it('returns "0 B" for Infinity', () => {
      expect(formatBytes(Infinity)).toBe('0 B')
    })

    it('returns "0 B" for -Infinity', () => {
      expect(formatBytes(-Infinity)).toBe('0 B')
    })

    it('returns "0 B" for 0', () => {
      expect(formatBytes(0)).toBe('0 B')
    })

    it('returns bytes without unit for values below base (binary)', () => {
      expect(formatBytes(512)).toBe('512 B')
    })

    it('returns bytes without unit for values below base (decimal)', () => {
      expect(formatBytes(999, { decimal: true })).toBe('999 B')
    })

    it('formats exactly the base value as KB', () => {
      expect(formatBytes(1024)).toBe('1.00 KB')
    })
  })

  describe('binary (default)', () => {
    it('formats KB', () => {
      expect(formatBytes(1024)).toBe('1.00 KB')
    })

    it('formats MB', () => {
      expect(formatBytes(1024 ** 2)).toBe('1.00 MB')
    })

    it('formats GB', () => {
      expect(formatBytes(1024 ** 3)).toBe('1.00 GB')
    })

    it('formats TB', () => {
      expect(formatBytes(1024 ** 4)).toBe('1.00 TB')
    })

    it('formats a fractional value', () => {
      expect(formatBytes(1536)).toBe('1.50 KB')
    })
  })

  describe('decimal', () => {
    it('formats KB with base 1000', () => {
      expect(formatBytes(1000, { decimal: true })).toBe('1.00 KB')
    })

    it('formats MB with base 1000', () => {
      expect(formatBytes(1000 ** 2, { decimal: true })).toBe('1.00 MB')
    })
  })

  describe('decimals option', () => {
    it('respects decimals=0', () => {
      expect(formatBytes(1536, { decimals: 0 })).toBe('2 KB')
    })

    it('respects decimals=3', () => {
      expect(formatBytes(1536, { decimals: 3 })).toBe('1.500 KB')
    })
  })

  describe('negative bytes', () => {
    it('formats negative bytes with a minus sign', () => {
      expect(formatBytes(-1024)).toBe('-1.00 KB')
    })

    it('formats negative GB', () => {
      expect(formatBytes(-(1024 ** 3))).toBe('-1.00 GB')
    })

    // BUG: formatBytes(-512) → Math.round(-512) = -512, returns "-512 B"
    // but the sign is applied from `bytes < 0` only for values >= base.
    // For sub-base negatives the sign comes from Math.round(bytes) itself,
    // so the output is correct — but let's verify explicitly.
    it('formats negative sub-base bytes correctly', () => {
      expect(formatBytes(-512)).toBe('-512 B')
    })
  })

  describe('PB', () => {
    it('formats 1 PB in binary', () => {
      expect(formatBytes(1024 ** 5)).toBe('1.00 PB')
    })

    it('formats 1 PB in decimal', () => {
      expect(formatBytes(1000 ** 5, { decimal: true })).toBe('1.00 PB')
    })

    it('formats 2 PB correctly', () => {
      expect(formatBytes(2 * 1024 ** 5)).toBe('2.00 PB')
    })
  })
})

describe('gbToBytes', () => {
  it('converts 1 GB to bytes in binary', () => {
    expect(gbToBytes(1)).toBe(1024 ** 3)
  })

  it('converts 1 GB to bytes in decimal', () => {
    expect(gbToBytes(1, true)).toBe(1000 ** 3)
  })

  it('converts 0 GB', () => {
    expect(gbToBytes(0)).toBe(0)
  })

  it('converts a fractional GB value', () => {
    expect(gbToBytes(1.5)).toBe(Math.round(1.5 * 1024 ** 3))
  })

  it('converts a negative GB value', () => {
    expect(gbToBytes(-1)).toBe(-(1024 ** 3))
  })
})

describe('bytesToGb', () => {
  it('converts 1 GB worth of bytes back to 1 in binary', () => {
    expect(bytesToGb(1024 ** 3)).toBe(1)
  })

  it('converts 1 GB worth of bytes back to 1 in decimal', () => {
    expect(bytesToGb(1000 ** 3, true)).toBe(1)
  })

  it('converts 0 bytes', () => {
    expect(bytesToGb(0)).toBe(0)
  })

  it('returns a float for non-round values', () => {
    expect(bytesToGb(512 * 1024 ** 2)).toBeCloseTo(0.5)
  })

  it('round-trips with gbToBytes (binary)', () => {
    const gb = 2.5
    expect(bytesToGb(gbToBytes(gb))).toBeCloseTo(gb)
  })

  it('round-trips with gbToBytes (decimal)', () => {
    const gb = 2.5
    expect(bytesToGb(gbToBytes(gb, true), true)).toBeCloseTo(gb)
  })
})
