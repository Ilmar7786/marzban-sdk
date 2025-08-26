import { z } from 'zod'

export const configSchema = z.object({
  baseUrl: z.url(),
  username: z.string().min(1),
  password: z.string().min(1),
  timeout: z.number().int().positive().optional().default(10),
  retries: z.number().int().nonnegative().optional().default(3),
  token: z.string().optional(),
  authenticateOnInit: z.boolean().optional().default(true),
})

export type Config = z.infer<typeof configSchema>
