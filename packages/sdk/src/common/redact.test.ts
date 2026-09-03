import { describe, expect, it } from 'vitest'

import { redactSecrets, redactUrlToken } from './redact'

describe('redactSecrets', () => {
  describe('primitives and simple values', () => {
    it('passes through strings, numbers, booleans, null, and undefined unchanged', () => {
      expect(redactSecrets('hello')).toBe('hello')
      expect(redactSecrets(42)).toBe(42)
      expect(redactSecrets(true)).toBe(true)
      expect(redactSecrets(null)).toBeNull()
      expect(redactSecrets(undefined)).toBeUndefined()
    })

    it('omits functions', () => {
      expect(redactSecrets(() => {})).toBeUndefined()
    })
  })

  describe('sensitive key redaction', () => {
    it.each([
      ['authorization', 'Authorization'],
      ['password', 'password'],
      ['token', 'Token'],
      ['access_token', 'accessToken'],
      ['refresh_token', 'refresh-token'],
      ['secret', 'clientSecret'],
      ['apiKey', 'api-key'],
      ['cookie', 'Set-Cookie'],
    ])('redacts a %s-style key regardless of casing/separators (%s)', (_label, key) => {
      const result = redactSecrets({ [key]: 'super-secret-value' }) as Record<string, unknown>
      expect(result[key]).toBe('[REDACTED]')
    })

    it('leaves non-sensitive keys untouched', () => {
      expect(redactSecrets({ username: 'admin', userId: 42 })).toEqual({ username: 'admin', userId: 42 })
    })

    it('redacts sensitive keys nested arbitrarily deep', () => {
      const result = redactSecrets({ a: { b: { c: { password: 'x', name: 'ok' } } } })
      expect(result).toEqual({ a: { b: { c: { password: '[REDACTED]', name: 'ok' } } } })
    })

    it('redacts sensitive keys inside arrays', () => {
      const result = redactSecrets([{ token: 'x' }, { token: 'y', ok: true }])
      expect(result).toEqual([{ token: '[REDACTED]' }, { token: '[REDACTED]', ok: true }])
    })
  })

  describe('Error handling', () => {
    it('extracts name, message, and stack from a plain Error', () => {
      const err = new Error('boom')
      const result = redactSecrets(err)
      expect(result.name).toBe('Error')
      expect(result.message).toBe('boom')
      expect(result.stack).toBe(err.stack)
    })

    it('redacts sensitive own-enumerable properties on an Error subclass', () => {
      class HttpLikeError extends Error {
        config = { headers: { Authorization: 'Bearer secret' }, url: '/api/x' }
      }
      const err = new HttpLikeError('Request failed')
      const result = redactSecrets(err)
      expect(result.message).toBe('Request failed')
      expect(result.config).toEqual({ headers: { Authorization: '[REDACTED]' }, url: '/api/x' })
    })
  })

  describe('non-plain objects', () => {
    it('normalizes an object with toJSON() into a plain object and redacts it', () => {
      class HeaderBag {
        Authorization = 'Bearer secret'
        'Content-Type' = 'application/json'
        toJSON() {
          return { Authorization: this.Authorization, 'Content-Type': this['Content-Type'] }
        }
      }
      const result = redactSecrets(new HeaderBag())
      expect(result).toEqual({ Authorization: '[REDACTED]', 'Content-Type': 'application/json' })
    })

    it('replaces an opaque class instance (no toJSON) with a short type tag', () => {
      class Socket {
        fd = 7
      }
      expect(redactSecrets(new Socket())).toBe('[Socket]')
    })

    it('replaces a class instance whose toJSON() throws with a short type tag', () => {
      class Broken {
        toJSON() {
          throw new Error('nope')
        }
      }
      expect(redactSecrets(new Broken())).toBe('[Unserializable]')
    })

    it('returns a primitive produced by toJSON() as-is', () => {
      class WrapsPrimitive {
        toJSON() {
          return 42
        }
      }
      expect(redactSecrets(new WrapsPrimitive())).toBe(42)
    })

    it('redacts an array produced by toJSON()', () => {
      class WrapsArray {
        toJSON() {
          return [{ token: 'x' }]
        }
      }
      expect(redactSecrets(new WrapsArray())).toEqual([{ token: '[REDACTED]' }])
    })

    it('treats an Object.create(null) object as a plain, walkable object', () => {
      const obj: Record<string, unknown> = Object.create(null)
      obj.password = 'x'
      obj.ok = true
      expect(redactSecrets(obj)).toEqual({ password: '[REDACTED]', ok: true })
    })

    it('falls back to a generic "Object" tag when the opaque instance has no resolvable constructor name', () => {
      function Weird(this: Record<string, unknown>) {
        this.fd = 7
      }
      Weird.prototype = Object.create(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const weird = new (Weird as any)()
      expect(redactSecrets(weird)).toBe('[Object]')
    })

    it('converts a Date to an ISO string', () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      expect(redactSecrets(date)).toBe(date.toISOString())
    })

    it('converts a RegExp to its string form', () => {
      expect(redactSecrets(/abc/gi)).toBe('/abc/gi')
    })

    it('replaces a typed array with a byte-length marker', () => {
      const bytes = new Uint8Array([1, 2, 3, 4])
      expect(redactSecrets(bytes)).toBe('[Binary 4 bytes]')
    })

    it('replaces an ArrayBuffer with a byte-length marker', () => {
      expect(redactSecrets(new ArrayBuffer(8))).toBe('[Binary 8 bytes]')
    })
  })

  describe('cycle and depth safety', () => {
    it('replaces a circular reference with a marker instead of overflowing', () => {
      const obj: Record<string, unknown> = { name: 'root' }
      obj.self = obj
      const result = redactSecrets(obj) as Record<string, unknown>
      expect(result.name).toBe('root')
      expect(result.self).toBe('[Circular]')
    })

    it('replaces a circular array reference with a marker', () => {
      const arr: unknown[] = [1, 2]
      arr.push(arr)
      const result = redactSecrets(arr) as unknown[]
      expect(result[0]).toBe(1)
      expect(result[2]).toBe('[Circular]')
    })

    it('truncates beyond the max depth', () => {
      let deep: Record<string, unknown> = { leaf: true }
      for (let i = 0; i < 10; i++) {
        deep = { nested: deep }
      }
      const json = JSON.stringify(redactSecrets(deep))
      expect(json).toContain('[Truncated]')
    })

    it('caps the number of entries walked in a large object', () => {
      const big: Record<string, number> = {}
      for (let i = 0; i < 100; i++) big[`key${i}`] = i
      const result = redactSecrets(big) as Record<string, unknown>
      expect(Object.keys(result).length).toBe(50)
    })

    it('caps the number of items walked in a large array', () => {
      const big = Array.from({ length: 100 }, (_, i) => i)
      const result = redactSecrets(big) as unknown[]
      expect(result.length).toBe(50)
    })
  })

  describe('JSON-shaped strings', () => {
    it('redacts a sensitive key inside an already-stringified JSON object', () => {
      const body = JSON.stringify({ username: 'admin', password: 'hunter2' })
      expect(redactSecrets(body)).toBe(JSON.stringify({ username: 'admin', password: '[REDACTED]' }))
    })

    it('redacts inside a stringified JSON array', () => {
      const body = JSON.stringify([{ token: 'x' }, { ok: true }])
      expect(redactSecrets(body)).toBe(JSON.stringify([{ token: '[REDACTED]' }, { ok: true }]))
    })

    it('leaves a plain non-JSON string unchanged', () => {
      expect(redactSecrets('Request failed with status code 401')).toBe('Request failed with status code 401')
    })

    it('leaves a string that merely starts with "{" but is not valid JSON unchanged', () => {
      expect(redactSecrets('{not valid json')).toBe('{not valid json')
    })
  })

  describe('realistic HTTP client error shape', () => {
    it('redacts an Authorization header and a request-body password while preserving useful fields', () => {
      const axiosLikeError = {
        message: 'Request failed with status code 401',
        code: 'ERR_BAD_REQUEST',
        config: {
          url: '/api/admin/token',
          method: 'post',
          headers: { Authorization: 'Bearer eyJhbGciOi...', 'Content-Type': 'application/json' },
          data: JSON.stringify({ username: 'admin', password: 'hunter2' }),
        },
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { detail: 'Incorrect username or password' },
        },
      }

      const result = redactSecrets(axiosLikeError)

      expect(result).toMatchObject({
        message: 'Request failed with status code 401',
        code: 'ERR_BAD_REQUEST',
        config: {
          url: '/api/admin/token',
          method: 'post',
          headers: { Authorization: '[REDACTED]', 'Content-Type': 'application/json' },
        },
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { detail: 'Incorrect username or password' },
        },
      })
      // `config.data` is itself a JSON string (axios stringifies the request
      // body before the error is thrown) — it gets parsed, redacted, and
      // re-stringified, so the password never survives even though the key
      // "data" isn't sensitive by name.
      const data = (result as { config: { data: string } }).config.data
      expect(data).not.toContain('hunter2')
      expect(JSON.parse(data)).toEqual({ username: 'admin', password: '[REDACTED]' })
    })
  })
})

describe('redactUrlToken', () => {
  it('replaces the named query parameter, leaving the rest of the URL intact', () => {
    const url = 'wss://panel.example.com/api/core/logs?interval=1&token=eyJhbGciOi...'
    expect(redactUrlToken(url, 'token')).toBe('wss://panel.example.com/api/core/logs?interval=1&token=REDACTED')
  })

  it('leaves the URL unchanged when the parameter is absent', () => {
    const url = 'wss://panel.example.com/api/core/logs?interval=1'
    expect(redactUrlToken(url, 'token')).toBe(url)
  })

  it('falls back to a regex replace when the URL is not parseable', () => {
    expect(redactUrlToken('not a url?token=secret&x=1', 'token')).toBe('not a url?token=REDACTED&x=1')
  })

  it('returns an unparseable URL unchanged when the parameter is absent from it too', () => {
    expect(redactUrlToken('not a url at all', 'token')).toBe('not a url at all')
  })
})
