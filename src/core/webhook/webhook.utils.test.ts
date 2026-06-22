import { afterEach, describe, expect, it } from 'vitest'

import { AnyType } from '@/common'
import { WebhookEnvironmentError, WebhookValidationError } from '@/core/errors'

import { BaseWebhookSchema } from './webhook.schema'
import { validateWebhookPayload, verifyWebhookSignature } from './webhook.utils'

const SECRET = 'topsecret'
const BODY = JSON.stringify([{ action: 'user_created' }])

/** Compute a hex HMAC-SHA256 the same way a Marzban server would. */
async function sign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
}

describe('verifyWebhookSignature', () => {
  afterEach(() => {
    delete (globalThis as AnyType).window
  })

  it('throws WebhookEnvironmentError in a browser environment', async () => {
    ;(globalThis as AnyType).window = { document: {} }
    await expect(verifyWebhookSignature('00', SECRET, BODY)).rejects.toThrow(WebhookEnvironmentError)
  })

  it('does not treat a Web Worker (no window/document) as a browser', async () => {
    // No window global → server-like runtime → verification proceeds.
    const signature = await sign(SECRET, BODY)
    await expect(verifyWebhookSignature(signature, SECRET, BODY)).resolves.toBe(true)
  })

  it('returns true when no secret is configured (no verification)', async () => {
    await expect(verifyWebhookSignature(undefined, undefined, BODY)).resolves.toBe(true)
  })

  it('returns false when signature is missing but secret is set', async () => {
    await expect(verifyWebhookSignature(undefined, SECRET, BODY)).resolves.toBe(false)
  })

  it('returns false for malformed hex (odd length)', async () => {
    await expect(verifyWebhookSignature('abc', SECRET, BODY)).resolves.toBe(false)
  })

  it('returns false for non-hex characters', async () => {
    await expect(verifyWebhookSignature('zz', SECRET, BODY)).resolves.toBe(false)
  })

  it('verifies a valid signature', async () => {
    const signature = await sign(SECRET, BODY)
    await expect(verifyWebhookSignature(signature, SECRET, BODY)).resolves.toBe(true)
  })

  it('rejects a signature computed with a different secret', async () => {
    const signature = await sign('wrong-secret', BODY)
    await expect(verifyWebhookSignature(signature, SECRET, BODY)).resolves.toBe(false)
  })

  it('rejects a valid-length signature that does not match', async () => {
    const signature = await sign(SECRET, 'different body')
    await expect(verifyWebhookSignature(signature, SECRET, BODY)).resolves.toBe(false)
  })

  it('accepts a Uint8Array body', async () => {
    const bytes = new TextEncoder().encode(BODY)
    const signature = await sign(SECRET, BODY)
    await expect(verifyWebhookSignature(signature, SECRET, bytes)).resolves.toBe(true)
  })
})

describe('validateWebhookPayload', () => {
  it('throws WebhookValidationError for a non-array input', () => {
    expect(() => validateWebhookPayload({})).toThrow(WebhookValidationError)
  })

  it('throws WebhookValidationError for an unknown action', () => {
    expect(() => validateWebhookPayload([{ action: 'nope' }])).toThrow(WebhookValidationError)
  })
})

describe('BaseWebhookSchema defaults', () => {
  it('fills enqueued_at, send_at, and tries when omitted', () => {
    const parsed = BaseWebhookSchema.parse({})
    expect(typeof parsed.enqueued_at).toBe('number')
    expect(typeof parsed.send_at).toBe('number')
    expect(parsed.tries).toBe(0)
  })
})
