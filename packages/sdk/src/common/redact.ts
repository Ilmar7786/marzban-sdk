/**
 * Keys whose values are always replaced, regardless of where they appear in
 * an object graph. Matched case-insensitively with `-`/`_`/whitespace
 * stripped, so `Authorization`, `authorization`, `Access-Token`, and
 * `access_token` all match the same entry.
 */
const SENSITIVE_KEYS = new Set([
  'authorization',
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'secret',
  'clientsecret',
  'apikey',
  'xapikey',
  'cookie',
  'setcookie',
])

const REDACTED = '[REDACTED]'
const MAX_DEPTH = 6
const MAX_ENTRIES = 50

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase().replace(/[-_\s]/g, ''))
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  // `walk`'s one call site (below) has already excluded null/non-object
  // values by this point — this guard is unreachable there today, but stays
  // for type-safety since the helper's own signature promises to handle any
  // `unknown` input, not just what its current caller happens to pass.
  /* istanbul ignore next */
  if (typeof value !== 'object' || value === null) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Axios (and similar HTTP clients) frequently store the outgoing request
 * body as an already-`JSON.stringify`'d string on `error.config.data` — for
 * this SDK, that's literally `{"username":"...","password":"..."}` on a
 * failed login. The key holding it ("data") isn't sensitive by name, so the
 * generic key-based redaction below would otherwise miss it entirely. Parse
 * JSON-object/array-shaped strings, redact recursively, and re-stringify —
 * anything that isn't valid JSON (a normal message, a URL, ...) passes
 * through unchanged.
 */
function redactJsonString(value: string, depth: number, seen: WeakSet<object>): string {
  const trimmed = value.trim()
  if (trimmed[0] !== '{' && trimmed[0] !== '[') return value
  try {
    // A string starting with '{' or '[' that parses successfully is always
    // an object or array (JSON has no other value type with those leading
    // characters), so `walk` below always receives something walkable.
    const parsed: unknown = JSON.parse(trimmed)
    return JSON.stringify(walk(parsed, depth, seen))
  } catch {
    return value
  }
}

function walk(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') return redactJsonString(value, depth, seen)
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' ? undefined : value
  }

  if (value instanceof Date) return value.toISOString()
  if (value instanceof RegExp) return value.toString()
  // Binary payloads are never useful in a log line and can be large — replace
  // with a short marker instead of walking their contents.
  if (ArrayBuffer.isView(value)) return `[Binary ${value.byteLength} bytes]`
  if (value instanceof ArrayBuffer) return `[Binary ${value.byteLength} bytes]`

  if (seen.has(value)) return '[Circular]'
  if (depth >= MAX_DEPTH) return '[Truncated]'

  if (Array.isArray(value)) {
    seen.add(value)
    return value.slice(0, MAX_ENTRIES).map(item => walk(item, depth + 1, seen))
  }

  // Duck-type serializable, non-plain objects (e.g. axios' AxiosHeaders,
  // which stores each header as an own enumerable property but exposes a
  // toJSON()) into a plain object first, so their real key/value pairs get
  // redacted instead of passing through opaquely — this is precisely where
  // an Authorization header would otherwise slip past the walker below.
  let target: unknown = value
  if (!isPlainObject(target) && !(target instanceof Error) && !Array.isArray(target)) {
    const toJSON = (target as { toJSON?: unknown }).toJSON
    if (typeof toJSON === 'function') {
      try {
        target = (toJSON as () => unknown).call(target)
      } catch {
        target = undefined
      }
    }
  }

  if (target === null || typeof target !== 'object') {
    return target === undefined ? '[Unserializable]' : target
  }
  if (Array.isArray(target)) return walk(target, depth, seen)
  if (!isPlainObject(target) && !(target instanceof Error)) {
    // Still not walkable after normalization (a Socket, Stream, Agent, ...) —
    // never recurse into these: no secrets live here worth the risk of
    // dumping huge, circular, or binary runtime internals into logs.
    const ctorName = target.constructor?.name
    return `[${typeof ctorName === 'string' ? ctorName : 'Object'}]`
  }

  seen.add(target as object)
  const out: Record<string, unknown> = {}
  if (target instanceof Error) {
    out.name = target.name
    out.message = target.message
    out.stack = target.stack
  }
  const keys = Object.keys(target as object).slice(0, MAX_ENTRIES)
  for (const key of keys) {
    const raw = (target as Record<string, unknown>)[key]
    out[key] = isSensitiveKey(key) ? REDACTED : walk(raw, depth + 1, seen)
  }
  return out
}

/**
 * Deep-redacts a value before it's logged or attached to a thrown error.
 *
 * Walks plain objects, arrays, `Error` instances (via their own enumerable
 * keys — this covers e.g. `AxiosError.config`/`.response`), and anything
 * with a `toJSON()` method (covers e.g. axios' `AxiosHeaders`). Bounded by a
 * depth/entry cap and cycle detection, so it's safe to run on arbitrary HTTP
 * client errors without risking a stack overflow on circular request/socket
 * references.
 *
 * Known secret-bearing keys (`authorization`, `password`, `token`, ...) are
 * always replaced with `'[REDACTED]'` wherever they appear in the graph —
 * including inside JSON-object/array-shaped strings (e.g. an already
 * `JSON.stringify`'d request body), which are parsed, redacted, and
 * re-stringified. Opaque runtime objects that aren't safely serializable
 * (sockets, streams, buffers) are never walked and are replaced with a short
 * type tag instead.
 *
 * @example
 * redactSecrets({ username: 'admin', password: 'hunter2' })
 * // => { username: 'admin', password: '[REDACTED]' }
 */
export function redactSecrets<T>(value: T): T {
  return walk(value, 0, new WeakSet()) as T
}

/**
 * Marker used by {@link redactUrlToken} instead of {@link REDACTED} — a query
 * parameter value is percent-encoded on serialization, and `[`/`]` would
 * round-trip as unreadable `%5B`/`%5D` noise in a URL.
 */
const REDACTED_URL_PARAM = 'REDACTED'

/**
 * Redacts one query parameter's value from a URL string, leaving the rest of
 * the URL intact.
 *
 * {@link redactSecrets} walks object graphs by key — it can't help here, since
 * a WebSocket connection URL carries its access token as a query parameter
 * (`?token=...`) rather than under a recognizable key on some object. Falls
 * back to a regex when `url` isn't parseable (so a caller building a URL by
 * hand, or building one for a log line before it's fully assembled, still
 * gets redaction instead of a thrown error).
 *
 * @example
 * redactUrlToken('wss://host/api/core/logs?interval=1&token=eyJhbGciOi...', 'token')
 * // => 'wss://host/api/core/logs?interval=1&token=REDACTED'
 */
export function redactUrlToken(url: string, paramName: string): string {
  try {
    const parsed = new URL(url)
    if (!parsed.searchParams.has(paramName)) return url
    parsed.searchParams.set(paramName, REDACTED_URL_PARAM)
    return parsed.toString()
  } catch {
    const pattern = new RegExp(`(${paramName}=)[^&]+`, 'i')
    return url.replace(pattern, `$1${REDACTED_URL_PARAM}`)
  }
}
