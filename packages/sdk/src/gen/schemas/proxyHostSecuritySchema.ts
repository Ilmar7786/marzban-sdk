import { z } from 'zod/v4'

import type { ProxyHostSecurity } from '../models/ProxyHostSecurity.ts'

export const proxyHostSecuritySchema = z.enum([
  'inbound_default',
  'none',
  'tls',
]) as unknown as z.ZodType<ProxyHostSecurity>
