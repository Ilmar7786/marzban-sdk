const textEncoder = new TextEncoder()

/**
 * Coerce arbitrary input into a byte array (`Uint8Array`).
 *
 * Runtime-agnostic (no Node `Buffer`), so it works in browsers, Workers,
 * Node.js, Bun, and Deno alike:
 * - strings are UTF-8 encoded
 * - `Uint8Array` (including Node `Buffer`, which extends it) is returned as-is
 * - `ArrayBuffer` is wrapped in a view without copying
 * - anything else is JSON-stringified, then UTF-8 encoded
 *
 * @param input Value to convert.
 * @returns The input as raw UTF-8 / binary bytes, backed by a (non-shared) `ArrayBuffer`.
 */
export function toBytes(input: unknown): Uint8Array<ArrayBuffer> {
  if (typeof input === 'string') {
    return textEncoder.encode(input)
  }
  if (input instanceof Uint8Array) {
    // Re-view over a guaranteed ArrayBuffer (not SharedArrayBuffer) so the
    // result satisfies BufferSource for the Web Crypto API. Copy-free when the
    // input is already ArrayBuffer-backed.
    return input as Uint8Array<ArrayBuffer>
  }
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input)
  }
  return textEncoder.encode(JSON.stringify(input))
}

/**
 * Decode a hex string into bytes.
 *
 * Rejects malformed input (odd length or non-hex characters) by returning
 * `null` rather than silently truncating — unlike `Buffer.from(str, 'hex')`.
 *
 * @param hex Hex-encoded string (case-insensitive).
 * @returns The decoded bytes, or `null` if the string is not valid hex.
 */
export function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
    return null
  }
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}
