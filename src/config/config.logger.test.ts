import { describe, expect, it } from 'vitest'

import { loggerConfigSchema, loggerObjectSchema } from './config.logger'

const noop = () => {}

describe('loggerConfigSchema', () => {
  it('accepts false', () => {
    expect(loggerConfigSchema.safeParse(false).success).toBe(true)
  })

  it('accepts options object with level and timestamp', () => {
    expect(loggerConfigSchema.safeParse({ level: 'info', timestamp: true }).success).toBe(true)
  })

  it('accepts full logger object with function methods', () => {
    const parsed = loggerConfigSchema.safeParse({
      debug: noop,
      info: noop,
      warn: noop,
      error: noop,
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects logger object when error is not a function', () => {
    const parsed = loggerObjectSchema.safeParse({
      debug: noop,
      info: noop,
      warn: noop,
      error: 'not-a-fn',
    })

    expect(parsed.success).toBe(false)
  })
})
