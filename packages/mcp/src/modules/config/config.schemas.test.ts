import { describe, expect, it } from 'vitest'

import { configUpdateInputSchema } from './config.schemas'

describe('configUpdateInputSchema', () => {
  it('accepts a config with array inbounds and outbounds', () => {
    const result = configUpdateInputSchema.safeParse({ config: { inbounds: [], outbounds: [] } })
    expect(result.success).toBe(true)
  })

  it('rejects a config missing inbounds or outbounds', () => {
    const result = configUpdateInputSchema.safeParse({ config: { inbounds: [] } })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('must include array fields')
  })

  it('rejects a config where inbounds/outbounds are not arrays', () => {
    const result = configUpdateInputSchema.safeParse({ config: { inbounds: 'nope', outbounds: [] } })
    expect(result.success).toBe(false)
  })
})
