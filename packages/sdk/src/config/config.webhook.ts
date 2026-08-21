import z from 'zod/v4'

export const webhookSchema = z.object({
  /**
   * Secret used to verify incoming webhook signatures (HMAC-SHA256).
   * When set, every incoming webhook must carry a valid signature.
   */
  secret: z.string().min(1).optional(),
})
