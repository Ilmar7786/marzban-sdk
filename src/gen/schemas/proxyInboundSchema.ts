import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { ProxyInbound } from '../models/ProxyInbound.ts'
import { proxyTypesSchema } from './proxyTypesSchema.ts'

export const proxyInboundSchema = z.object({
  tag: z.string(),
  get protocol() {
    return proxyTypesSchema
  },
  network: z.string(),
  tls: z.string(),
  port: z.union([z.int(), z.string()]),
}) as unknown as ToZod<ProxyInbound>

export type ProxyInboundSchema = ProxyInbound
