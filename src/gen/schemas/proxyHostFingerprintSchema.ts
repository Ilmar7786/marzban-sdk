import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { ProxyHostFingerprint } from '../models/ProxyHostFingerprint.ts'

export const proxyHostFingerprintSchema = z.enum([
  '',
  'chrome',
  'firefox',
  'safari',
  'ios',
  'android',
  'edge',
  '360',
  'qq',
  'random',
  'randomized',
]) as unknown as ToZod<ProxyHostFingerprint>
