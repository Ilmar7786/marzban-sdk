import { z } from 'zod/v4'

import type { ProxyTypes } from '../models/ProxyTypes.ts'

export const proxyTypesSchema = z.enum(['vmess', 'vless', 'trojan', 'shadowsocks']) as unknown as z.ZodType<ProxyTypes>
