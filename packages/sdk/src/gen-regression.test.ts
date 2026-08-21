import { describe, expect, it } from 'vitest'

import { getCoreConfig200Schema, getCoreConfigQueryResponseSchema } from '@/gen/schemas/CoreSchema/getCoreConfigSchema'
import {
  modifyCoreConfig200Schema,
  modifyCoreConfigMutationRequestSchema,
} from '@/gen/schemas/CoreSchema/modifyCoreConfigSchema'
import { proxySettingsSchema } from '@/gen/schemas/proxySettingsSchema'
import { subscriptionUserResponseSchema } from '@/gen/schemas/subscriptionUserResponseSchema'
import { userResponseSchema } from '@/gen/schemas/userResponseSchema'

// kubb generates `z.object({})` for OpenAPI schemas of `type: object` without a
// `properties` list. zod v4 objects are strip-mode by default, so `.parse()`
// silently drops every key on such a schema — the SDK would hand back `{}` for
// the Xray core config and empty `proxies` objects, and would send `{}` to the
// server on `modifyCoreConfig`. The fix lives in `openapi/openapi.json`
// (`additionalProperties`); these tests pin the generated behavior so the next
// `pnpm codegen` run can't silently reintroduce the bug.

const xrayCoreConfig = {
  log: { loglevel: 'warning' },
  inbounds: [{ tag: 'vless', port: 443, protocol: 'vless' }],
  outbounds: [{ tag: 'direct', protocol: 'freedom' }],
  routing: { rules: [{ outboundTag: 'direct', domain: ['geosite:private'] }] },
}

const vlessProxySettings = { id: '35e4e39c-7d5c-4f4b-8b71-558e4f37ff53', flow: 'xtls-rprx-vision' }

describe('gen regression: open-ended object schemas keep unknown keys', () => {
  it('proxySettingsSchema preserves protocol-specific fields', () => {
    expect(proxySettingsSchema.parse(vlessProxySettings)).toEqual(vlessProxySettings)
  })

  it('userResponseSchema.proxies preserves each protocol entry and its settings', () => {
    const user = {
      proxies: { vless: vlessProxySettings, vmess: { id: 'a1b2' } },
      username: 'alice',
      status: 'active',
      used_traffic: 0,
      created_at: '2026-01-01T00:00:00Z',
    }

    const result = userResponseSchema.parse(user)

    expect(result.proxies).toEqual(user.proxies)
  })

  it('subscriptionUserResponseSchema.proxies preserves each protocol entry and its settings', () => {
    const user = {
      proxies: { vless: vlessProxySettings },
      username: 'alice',
      status: 'active',
      used_traffic: 0,
      created_at: '2026-01-01T00:00:00Z',
    }

    const result = subscriptionUserResponseSchema.parse(user)

    expect(result.proxies).toEqual(user.proxies)
  })

  it('getCoreConfig200Schema preserves the full Xray core config on read', () => {
    expect(getCoreConfig200Schema.parse(xrayCoreConfig)).toEqual(xrayCoreConfig)
    expect(getCoreConfigQueryResponseSchema.parse(xrayCoreConfig)).toEqual(xrayCoreConfig)
  })

  it('modifyCoreConfigMutationRequestSchema preserves the full payload sent to the server', () => {
    expect(modifyCoreConfigMutationRequestSchema.parse(xrayCoreConfig)).toEqual(xrayCoreConfig)
  })

  it('modifyCoreConfig200Schema preserves the full config echoed back after a write', () => {
    expect(modifyCoreConfig200Schema.parse(xrayCoreConfig)).toEqual(xrayCoreConfig)
  })
})
