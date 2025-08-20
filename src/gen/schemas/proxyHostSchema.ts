import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { ProxyHost } from '../models/ProxyHost.ts'
import { proxyHostALPNSchema } from './proxyHostALPNSchema.ts'
import { proxyHostFingerprintSchema } from './proxyHostFingerprintSchema.ts'
import { proxyHostSecuritySchema } from './proxyHostSecuritySchema.ts'

export const proxyHostSchema = z.object({
  remark: z.string(),
  address: z.string(),
  port: z.union([z.int(), z.null()]).nullable().nullish(),
  sni: z.union([z.string(), z.null()]).nullable().nullish(),
  host: z.union([z.string(), z.null()]).nullable().nullish(),
  path: z.union([z.string(), z.null()]).nullable().nullish(),
  get security() {
    return proxyHostSecuritySchema.optional()
  },
  get alpn() {
    return proxyHostALPNSchema.optional()
  },
  get fingerprint() {
    return proxyHostFingerprintSchema.optional()
  },
  allowinsecure: z.union([z.boolean(), z.null()]).optional(),
  is_disabled: z.union([z.boolean(), z.null()]).optional(),
  mux_enable: z.union([z.boolean(), z.null()]).optional(),
  fragment_setting: z.union([z.string(), z.null()]).nullable().nullish(),
  noise_setting: z.union([z.string(), z.null()]).nullable().nullish(),
  random_user_agent: z.union([z.boolean(), z.null()]).optional(),
  use_sni_as_host: z.union([z.boolean(), z.null()]).optional(),
}) as unknown as ToZod<ProxyHost>

export type ProxyHostSchema = ProxyHost
