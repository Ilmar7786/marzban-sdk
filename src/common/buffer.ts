export function toBuffer(input: unknown): Buffer {
  if (typeof input === 'string') {
    return Buffer.from(input)
  }
  if (Buffer.isBuffer(input)) {
    return input
  }
  return Buffer.from(JSON.stringify(input))
}
