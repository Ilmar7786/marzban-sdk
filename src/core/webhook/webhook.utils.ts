import { getSubtleCrypto, hexToBytes, isBrowser, toBytes } from '@/common'
import { WebhookEnvironmentError, WebhookValidationError } from '@/core/errors'

import { WebhookArraySchema, WebhookArrayType } from './webhook.schema'

export function validateWebhookPayload(input: unknown): WebhookArrayType {
  try {
    return WebhookArraySchema.parse(input)
  } catch (err) {
    throw new WebhookValidationError(err)
  }
}

/**
 * Verify a webhook signature against the HMAC-SHA256 of the raw body.
 *
 * Uses the Web Crypto API (`crypto.subtle`), so it runs in any modern runtime
 * (Node.js 19+, browsers, Workers, Bun, Deno) without pulling `node:crypto`
 * into browser bundles. `subtle.verify` performs the comparison in constant
 * time, guarding against timing attacks.
 *
 * Behavior:
 * - browser runtime → throws {@link WebhookEnvironmentError} (server-side only)
 * - secret not configured → always returns `true` (no verification)
 * - missing or malformed-hex signature → returns `false`
 *
 * @param signature Hex-encoded signature received with the webhook.
 * @param secret Shared secret configured for the webhook.
 * @param data Raw request body the signature was computed over.
 * @returns `true` when the signature is valid.
 * @throws {WebhookEnvironmentError} When invoked from a browser environment.
 */
export async function verifyWebhookSignature(
  signature: string | undefined,
  secret: string | undefined,
  data: Uint8Array | string
): Promise<boolean> {
  // Webhook verification is server-to-server: it needs the shared secret, which
  // must never reach a browser client. Block it before any crypto runs.
  // Web Workers, Node.js, Bun, Deno and edge/worker runtimes are NOT browsers
  // (no window/document) and pass through.
  if (isBrowser()) {
    throw new WebhookEnvironmentError()
  }

  if (!secret) return true // secret not configured
  if (!signature) return false

  // hexToBytes rejects malformed hex (odd length / non-hex chars) instead of
  // silently truncating, so a garbage signature can never match by accident.
  const signatureBytes = hexToBytes(signature)
  if (!signatureBytes) return false

  const subtle = getSubtleCrypto()
  const key = await subtle.importKey('raw', toBytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])

  // subtle.verify recomputes the HMAC over `data` and compares it to the
  // provided signature in constant time, returning false on any mismatch
  // (including a length mismatch).
  return subtle.verify('HMAC', key, signatureBytes, toBytes(data))
}
