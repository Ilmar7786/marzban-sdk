import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

import type { BodyAdminTokenApiAdminTokenPost } from '../models/BodyAdminTokenApiAdminTokenPost.ts'

export const bodyAdminTokenApiAdminTokenPostSchema = z.object({
  grant_type: z.union([z.string().regex(/password/), z.null()]).optional(),
  username: z.string(),
  password: z.string(),
  scope: z.string().default(''),
  client_id: z.union([z.string(), z.null()]).optional(),
  client_secret: z.union([z.string(), z.null()]).optional(),
}) as unknown as ToZod<BodyAdminTokenApiAdminTokenPost>

export type BodyAdminTokenApiAdminTokenPostSchema = BodyAdminTokenApiAdminTokenPost
