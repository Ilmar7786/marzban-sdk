import { describe, expect, it } from 'vitest'

import { hexToBytes, toBytes } from './buffer'

const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

describe('toBytes', () => {
  describe('string input', () => {
    it('returns a Uint8Array for a regular ASCII string', () => {
      const result = toBytes('hello')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(decode(result)).toBe('hello')
    })

    it('returns an empty Uint8Array for an empty string', () => {
      const result = toBytes('')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(0)
    })

    it('correctly encodes a UTF-8 string (cyrillic)', () => {
      const result = toBytes('Привет')
      expect(decode(result)).toBe('Привет')
    })

    it('correctly encodes an emoji (multi-byte character)', () => {
      const result = toBytes('🔥')
      expect(result.length).toBe(4) // emoji takes 4 bytes in UTF-8
      expect(decode(result)).toBe('🔥')
    })

    it('handles a string containing a null character \\0', () => {
      const result = toBytes('a\0b')
      expect(result.length).toBe(3)
    })
  })

  describe('Uint8Array / Buffer input', () => {
    it('returns the same Uint8Array reference (no copy)', () => {
      const bytes = new Uint8Array([1, 2, 3])
      expect(toBytes(bytes)).toBe(bytes)
    })

    it('returns a Node Buffer as-is (Buffer extends Uint8Array)', () => {
      const buf = Buffer.from('test')
      expect(toBytes(buf)).toBe(buf)
    })

    it('preserves binary data', () => {
      const bytes = new Uint8Array([0x00, 0xff, 0x80, 0x7f])
      const result = toBytes(bytes)
      expect(result[1]).toBe(0xff)
    })
  })

  describe('ArrayBuffer input', () => {
    it('wraps an ArrayBuffer in a view', () => {
      const ab = new Uint8Array([5, 6, 7]).buffer
      const result = toBytes(ab)
      expect(result).toBeInstanceOf(Uint8Array)
      expect([...result]).toEqual([5, 6, 7])
    })
  })

  describe('object input', () => {
    it('serializes a plain object to JSON', () => {
      const obj = { key: 'value', num: 42 }
      expect(JSON.parse(decode(toBytes(obj)))).toEqual(obj)
    })

    it('serializes an array to JSON', () => {
      const arr = [1, 'two', true, null]
      expect(JSON.parse(decode(toBytes(arr)))).toEqual(arr)
    })

    it('serializes an empty object', () => {
      expect(decode(toBytes({}))).toBe('{}')
    })

    it('serializes a nested object', () => {
      const nested = { a: { b: { c: 42 } } }
      expect(JSON.parse(decode(toBytes(nested)))).toEqual(nested)
    })

    it('serializes Date via toJSON to an ISO string', () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      expect(JSON.parse(decode(toBytes({ d: date }))).d).toBe('2024-01-01T00:00:00.000Z')
    })

    it('throws TypeError for circular references', () => {
      const obj: Record<string, unknown> = { a: 1 }
      obj.self = obj
      expect(() => toBytes(obj)).toThrow(TypeError)
    })
  })

  describe('primitive input', () => {
    it('serializes an integer', () => {
      expect(decode(toBytes(42))).toBe('42')
    })

    it('serializes a float', () => {
      expect(decode(toBytes(3.14))).toBe('3.14')
    })

    it('coerces NaN to "null" (JSON.stringify semantics)', () => {
      expect(decode(toBytes(NaN))).toBe('null')
    })

    it('serializes booleans', () => {
      expect(decode(toBytes(true))).toBe('true')
      expect(decode(toBytes(false))).toBe('false')
    })

    it('serializes null to "null"', () => {
      expect(decode(toBytes(null))).toBe('null')
    })
  })

  describe('non-serializable input (JSON.stringify → undefined)', () => {
    it('returns empty bytes for undefined', () => {
      expect(toBytes(undefined).length).toBe(0)
    })

    it('returns empty bytes for a symbol', () => {
      expect(toBytes(Symbol('test')).length).toBe(0)
    })

    it('returns empty bytes for a function', () => {
      expect(toBytes(() => {}).length).toBe(0)
    })
  })

  describe('return type invariant', () => {
    const cases: Array<[string, unknown]> = [
      ['string', 'hello'],
      ['Uint8Array', new Uint8Array([1])],
      ['object', { a: 1 }],
      ['array', [1, 2]],
      ['number', 42],
      ['boolean', true],
      ['null', null],
    ]

    it.each(cases)('always returns a Uint8Array for %s', (_label, input) => {
      expect(toBytes(input)).toBeInstanceOf(Uint8Array)
    })
  })
})

describe('hexToBytes', () => {
  it('decodes lowercase hex', () => {
    expect([...hexToBytes('00ff80')!]).toEqual([0x00, 0xff, 0x80])
  })

  it('decodes uppercase hex (case-insensitive)', () => {
    expect([...hexToBytes('00FF80')!]).toEqual([0x00, 0xff, 0x80])
  })

  it('decodes an empty string to empty bytes', () => {
    const result = hexToBytes('')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result!.length).toBe(0)
  })

  it('returns null for odd-length input', () => {
    expect(hexToBytes('abc')).toBeNull()
  })

  it('returns null for non-hex characters', () => {
    expect(hexToBytes('zz')).toBeNull()
    expect(hexToBytes('00gg')).toBeNull()
  })

  it('round-trips with a known HMAC-like hex string', () => {
    const hex = 'deadbeef'
    expect([...hexToBytes(hex)!]).toEqual([0xde, 0xad, 0xbe, 0xef])
  })
})
