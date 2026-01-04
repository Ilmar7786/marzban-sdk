import crypto from 'node:crypto'

import { WebhookValidationError } from '@/core/errors'

import { WebhookArraySchema, WebhookArrayType } from './webhook.schema'

export function validateWebhookPayload(input: unknown): WebhookArrayType {
  try {
    return WebhookArraySchema.parse(input)
  } catch (err) {
    throw new WebhookValidationError(err)
  }
}

/**
 * Verify the x-webhook-secret header against HMAC-SHA256 signature.
 * - If secret is not configured → always returns true (no verification).
 * - If secret is configured → require `x-webhook-secret` with valid HMAC-SHA256.
 */
export function verifyWebhookSignature(
  signature: string | undefined,
  secret: string | undefined,
  data: Buffer | string
): boolean {
  if (!secret) return true // secret not configured
  if (!signature) return false

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(data)
  const expected = hmac.digest() // Buffer

  let actual: Buffer
  try {
    actual = Buffer.from(signature, 'hex')
  } catch {
    return false
  }

  if (actual.length !== expected.length) return false

  return crypto.timingSafeEqual(actual, expected)
}
