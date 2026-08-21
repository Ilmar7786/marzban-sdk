import { z } from 'zod/v4'

import type { ProxyHostALPN } from '../models/ProxyHostALPN.ts'

export const proxyHostALPNSchema = z.enum([
  '',
  'h3',
  'h2',
  'http/1.1',
  'h3,h2,http/1.1',
  'h3,h2',
  'h2,http/1.1',
]) as unknown as z.ZodType<ProxyHostALPN>
