import z from 'zod/v4'

export const webhookSchema = z.object({
  secret: z.string().optional(),
})
