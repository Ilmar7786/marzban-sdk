import { z } from 'zod/v4'

import type { BodyAdminTokenApiAdminTokenPost } from '../models/BodyAdminTokenApiAdminTokenPost.ts'

export const bodyAdminTokenApiAdminTokenPostSchema = z.object({
  grant_type: z.optional(z.union([z.string().regex(/password/), z.null()])),
  username: z.string(),
  password: z.string(),
  scope: z.optional(z.string().default('')),
  client_id: z.optional(z.union([z.string(), z.null()])),
  client_secret: z.optional(z.union([z.string(), z.null()])),
}) as unknown as z.ZodType<BodyAdminTokenApiAdminTokenPost>
