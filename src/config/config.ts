import { z } from 'zod'

export const configSchema = z.object({
  baseUrl: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  timeout: z.number().int().positive().default(10),
  retries: z.number().int().nonnegative().default(3),
  token: z.string().optional(),
  authenticateOnInit: z.boolean().default(true),
})

export type Config = z.infer<typeof configSchema>
