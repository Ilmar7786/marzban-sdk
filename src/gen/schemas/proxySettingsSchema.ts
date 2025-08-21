import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { ProxySettings } from '../models/ProxySettings.ts'

export const proxySettingsSchema = z.object({}) as unknown as ToZod<ProxySettings>
