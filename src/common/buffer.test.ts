import { describe, expect, it } from 'vitest'

import { toBuffer } from './buffer'

describe('toBuffer', () => {
  describe('string input', () => {
    it('returns a Buffer for a regular ASCII string', () => {
      const result = toBuffer('hello')
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.toString()).toBe('hello')
    })

    it('returns an empty Buffer for an empty string', () => {
      const result = toBuffer('')
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('correctly encodes a UTF-8 string (cyrillic)', () => {
      const result = toBuffer('Привет')
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.toString('utf8')).toBe('Привет')
    })

    it('correctly encodes an emoji (multi-byte character)', () => {
      const result = toBuffer('🔥')
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.length).toBe(4) // emoji takes 4 bytes in UTF-8
      expect(result.toString('utf8')).toBe('🔥')
    })

    it('handles a string containing null character \\0', () => {
      const result = toBuffer('a\0b')
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(result.length).toBe(3)
    })

    // BUG: Buffer.from(string) uses UTF-8 by default.
    // A base64 string is treated as plain text, not decoded.
    it('does NOT decode base64 strings — treats them as plain UTF-8', () => {
      const b64 = Buffer.from('hello').toString('base64') // 'aGVsbG8='
      const result = toBuffer(b64)
      expect(result.toString('utf8')).toBe(b64)
      expect(result.equals(Buffer.from(b64, 'base64'))).toBe(false)
    })
  })

  describe('Buffer input', () => {
    it('returns the same Buffer reference (no copy)', () => {
      const buf = Buffer.from('test')
      const result = toBuffer(buf)
      expect(result).toBe(buf)
    })

    it('returns an empty Buffer as-is', () => {
      const buf = Buffer.alloc(0)
      expect(toBuffer(buf)).toBe(buf)
    })

    // BUG: the function returns the original reference, not a copy.
    // Mutating the result also mutates the original buffer.
    it('BUG: mutating the result mutates the original', () => {
      const original = Buffer.from([1, 2, 3])
      const result = toBuffer(original)
      result[0] = 99
      expect(original[0]).toBe(99)
    })

    it('handles a Buffer with binary data', () => {
      const buf = Buffer.from([0x00, 0xff, 0x80, 0x7f])
      const result = toBuffer(buf)
      expect(result).toBe(buf)
      expect(result[1]).toBe(0xff)
    })
  })

  describe('object input', () => {
    it('serializes a plain object to JSON', () => {
      const obj = { key: 'value', num: 42 }
      const result = toBuffer(obj)
      expect(Buffer.isBuffer(result)).toBe(true)
      expect(JSON.parse(result.toString())).toEqual(obj)
    })

    it('serializes an array to JSON', () => {
      const arr = [1, 'two', true, null]
      const result = toBuffer(arr)
      expect(JSON.parse(result.toString())).toEqual(arr)
    })

    it('serializes an empty object', () => {
      expect(toBuffer({}).toString()).toBe('{}')
    })

    it('serializes a nested object', () => {
      const nested = { a: { b: { c: 42 } } }
      const result = toBuffer(nested)
      expect(JSON.parse(result.toString())).toEqual(nested)
    })

    it('Date is serialized via toJSON to an ISO string', () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      const result = toBuffer({ d: date })
      expect(JSON.parse(result.toString()).d).toBe('2024-01-01T00:00:00.000Z')
    })

    // BUG: Map has no toJSON method, so JSON.stringify produces '{}'.
    // All data is silently lost.
    it('BUG: Map serializes to "{}" — data is lost', () => {
      const map = new Map([['key', 'val']])
      expect(toBuffer(map).toString()).toBe('{}')
    })

    // BUG: same issue for Set.
    it('BUG: Set serializes to "{}" — data is lost', () => {
      expect(toBuffer(new Set([1, 2, 3])).toString()).toBe('{}')
    })

    // BUG: circular reference causes JSON.stringify to throw TypeError.
    it('BUG: throws TypeError for circular references', () => {
      const obj: Record<string, unknown> = { a: 1 }
      obj.self = obj
      expect(() => toBuffer(obj)).toThrow(TypeError)
    })
  })

  describe('number input', () => {
    it('serializes an integer', () => {
      expect(toBuffer(42).toString()).toBe('42')
    })

    it('serializes a negative number', () => {
      expect(toBuffer(-7).toString()).toBe('-7')
    })

    it('serializes a float', () => {
      expect(toBuffer(3.14).toString()).toBe('3.14')
    })

    // BUG: JSON.stringify(NaN) returns 'null', not 'NaN'.
    // The value is silently coerced.
    it('BUG: NaN becomes "null"', () => {
      expect(toBuffer(NaN).toString()).toBe('null')
    })

    it('BUG: Infinity becomes "null"', () => {
      expect(toBuffer(Infinity).toString()).toBe('null')
    })

    it('BUG: -Infinity becomes "null"', () => {
      expect(toBuffer(-Infinity).toString()).toBe('null')
    })

    // BUG: JSON.stringify(-0) returns '0' — the sign is lost.
    it('BUG: -0 serializes as "0" — sign is lost', () => {
      expect(toBuffer(-0).toString()).toBe('0')
    })
  })

  describe('boolean input', () => {
    it('serializes true', () => {
      expect(toBuffer(true).toString()).toBe('true')
    })

    it('serializes false', () => {
      expect(toBuffer(false).toString()).toBe('false')
    })
  })

  describe('null and undefined', () => {
    it('null serializes to "null"', () => {
      expect(toBuffer(null).toString()).toBe('null')
    })

    // BUG: JSON.stringify(undefined) returns undefined (not the string "undefined").
    // Buffer.from(undefined) then throws a TypeError.
    it('BUG: undefined throws TypeError', () => {
      expect(() => toBuffer(undefined)).toThrow(TypeError)
    })
  })

  describe('Symbol input', () => {
    // BUG: JSON.stringify(Symbol()) returns undefined → Buffer.from(undefined) throws.
    it('BUG: Symbol throws TypeError', () => {
      expect(() => toBuffer(Symbol('test'))).toThrow(TypeError)
    })
  })

  describe('function input', () => {
    // BUG: JSON.stringify(() => {}) returns undefined → Buffer.from(undefined) throws.
    it('BUG: function throws TypeError', () => {
      expect(() => toBuffer(() => {})).toThrow(TypeError)
    })
  })

  describe('return type invariant', () => {
    const cases: Array<[string, unknown]> = [
      ['string', 'hello'],
      ['Buffer', Buffer.from('x')],
      ['object', { a: 1 }],
      ['array', [1, 2]],
      ['number', 42],
      ['boolean', true],
      ['null', null],
    ]

    it.each(cases)('always returns a Buffer for %s', (_label, input) => {
      expect(Buffer.isBuffer(toBuffer(input))).toBe(true)
    })
  })

  describe('idempotency', () => {
    it('calling toBuffer twice on a Buffer returns the same reference', () => {
      const buf = toBuffer('hello')
      expect(toBuffer(buf)).toBe(buf)
    })

    it('calling toBuffer twice on an object wraps JSON bytes, then returns them as-is', () => {
      const once = toBuffer({ x: 1 })
      expect(toBuffer(once)).toBe(once)
    })
  })
})
