import { z } from 'zod/v4'

import type { ProxySettings } from '../models/ProxySettings.ts'

export const proxySettingsSchema = z.object({}).catchall(z.any()) as unknown as z.ZodType<ProxySettings>
