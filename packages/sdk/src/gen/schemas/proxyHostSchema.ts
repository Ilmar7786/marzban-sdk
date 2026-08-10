import { z } from 'zod/v4'

import type { ProxyHost } from '../models/ProxyHost.ts'
import { proxyHostALPNSchema } from './proxyHostALPNSchema.ts'
import { proxyHostFingerprintSchema } from './proxyHostFingerprintSchema.ts'
import { proxyHostSecuritySchema } from './proxyHostSecuritySchema.ts'

export const proxyHostSchema = z.object({
  remark: z.string(),
  address: z.string(),
  port: z.union([z.int(), z.null()]).nullish(),
  sni: z.union([z.string(), z.null()]).nullish(),
  host: z.union([z.string(), z.null()]).nullish(),
  path: z.union([z.string(), z.null()]).nullish(),
  get security() {
    return proxyHostSecuritySchema.default('inbound_default').optional()
  },
  get alpn() {
    return proxyHostALPNSchema.default('').optional()
  },
  get fingerprint() {
    return proxyHostFingerprintSchema.default('').optional()
  },
  allowinsecure: z.optional(z.union([z.boolean(), z.null()])),
  is_disabled: z.optional(z.union([z.boolean(), z.null()])),
  mux_enable: z.optional(z.union([z.boolean(), z.null()])),
  fragment_setting: z.union([z.string(), z.null()]).nullish(),
  noise_setting: z.union([z.string(), z.null()]).nullish(),
  random_user_agent: z.optional(z.union([z.boolean(), z.null()])),
  use_sni_as_host: z.optional(z.union([z.boolean(), z.null()])),
}) as unknown as z.ZodType<ProxyHost>
