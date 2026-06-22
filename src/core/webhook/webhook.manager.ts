import { SafeEventEmitter, toBuffer } from '@/common'
import { SdkError, WebhookSignatureError, WebhookValidationError } from '@/core/errors'
import { Logger } from '@/core/logger'

import { WebhookType } from './webhook.schema'
import { validateWebhookPayload, verifyWebhookSignature } from './webhook.utils'

/**
 * WebhookActionMap
 * - Map of action name => payload. Using Record<string, WebhookPayload> keeps
 *   the typings flexible for providers that supply arbitrary action strings.
 */
export type WebhookActionMap = {
  [A in WebhookType['action']]: Extract<WebhookType, { action: A }>
}

/**
 * WebhookEventMap
 * - Includes specific action keys (via WebhookActionMap), wildcard '*' and 'batch'.
 */
export type WebhookEventMap = WebhookActionMap & {
  '*': WebhookType // Wildcard for any single webhook
  batch: WebhookType[] // Batch of webhooks
}

export interface WebhookManagerOptions {
  /**
   * Secret used for webhook signature verification.
   *
   * If provided, all incoming webhooks must include
   * a valid signature.
   */
  secret?: string

  /**
   * Logger instance used for internal webhook logging.
   */
  logger: Logger
}

/**
 * Handles incoming webhook events from Marzban.
 *
 * Features:
 * - Signature verification
 * - Payload validation
 * - Typed event subscriptions
 * - Wildcard event listeners
 * - Batch webhook processing
 * - Manual event dispatching
 *
 * Supports subscribing to:
 * - Specific webhook actions
 * - All events via '*'
 * - Batch events via 'batch'
 *
 * @example
 * webhook.on('user_created', payload => {
 *   console.log(payload.username)
 * })
 *
 * @example
 * webhook.on('*', payload => {
 *   console.log(payload.action)
 * })
 */
export class WebhookManager {
  private readonly _secret?: string
  private readonly _emitter: SafeEventEmitter<WebhookEventMap>
  private readonly _logger: Logger

  /**
   * Constructor
   * @param secret Optional webhook secret for verifying signatures
   * @param logger Logger instance for logging events
   */
  constructor({ secret, logger }: WebhookManagerOptions) {
    this._secret = secret
    this._logger = logger
    this._emitter = new SafeEventEmitter<WebhookEventMap>()

    this._logger.info('WebhookManager initialized', 'WebhookManager')
  }

  // --- Subscription methods ---

  /**
   * Subscribe to an event
   * @param event Event name (specific action, '*', or 'batch')
   * @param listener Function to handle the payload
   */
  on<E extends keyof WebhookEventMap>(event: E, listener: (payload: WebhookEventMap[E]) => void): this {
    this._emitter.on(event, listener)
    this._logger.debug(`Listener added for event: ${String(event)}`, 'WebhookManager')
    return this
  }

  /**
   * Subscribe to an event once (one-time listener)
   */
  once<E extends keyof WebhookEventMap>(event: E, listener: (payload: WebhookEventMap[E]) => void): this {
    this._emitter.once(event, listener)
    this._logger.debug(`One-time listener added for event: ${String(event)}`, 'WebhookManager')
    return this
  }

  /**
   * Unsubscribe a listener from an event
   */
  off<E extends keyof WebhookEventMap>(event: E, listener: (payload: WebhookEventMap[E]) => void): this {
    this._emitter.off(event, listener)
    this._logger.debug(`Listener removed for event: ${String(event)}`, 'WebhookManager')
    return this
  }

  /**
   * Validate incoming webhook payloads and verify signature when secret configured.
   *
   * Important:
   * - If a secret is configured for the manager, the caller MUST pass the raw request body
   *   (Buffer or string) so signature verification is performed against the original bytes.
   *
   * @param rawBody Incoming webhook raw body (Buffer|string) OR already-parsed object.
   * @param signature Optional webhook signature to verify (hex string)
   * @returns Array of validated webhook payloads
   */
  parseWebhook(rawBody: unknown, signature?: string): WebhookType[] {
    this._logger.debug('Parsing incoming webhook payload', 'WebhookManager')

    // If secret is configured — require signature and raw body (Buffer|string)
    if (this._secret) {
      if (!signature) {
        this._logger.error('Webhook signature is missing but secret is configured', 'WebhookManager')
        throw new WebhookSignatureError()
      }

      if (!(Buffer.isBuffer(rawBody) || typeof rawBody === 'string')) {
        this._logger.error(
          'Webhook secret is configured: parseWebhook requires raw request body (Buffer or string) for signature verification',
          'WebhookManager'
        )
        throw new WebhookSignatureError('Raw body required for signature verification')
      }

      const ok = verifyWebhookSignature(signature, this._secret, toBuffer(rawBody))
      if (!ok) {
        // Do not log rawBody — it may contain user PII. The signature is a hash, not a secret.
        this._logger.error('Webhook signature verification failed', { signature }, 'WebhookManager')
        throw new WebhookSignatureError()
      } else {
        this._logger.debug('Webhook signature verified successfully', 'WebhookManager')
      }
    }

    // Parse JSON if necessary
    let parsed: unknown = rawBody
    if (Buffer.isBuffer(rawBody) || typeof rawBody === 'string') {
      try {
        parsed = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString() : rawBody)
      } catch (err) {
        this._logger.error('Failed to parse webhook JSON body', err, 'WebhookManager')
        // Let validateWebhookPayload throw a structured error if necessary,
        // but provide a clear message for parse errors.
        throw new WebhookValidationError(err)
      }
    }

    // Validate payload structure (will throw WebhookValidationError on failure)
    const payloads = validateWebhookPayload(parsed)
    this._logger.info(`Validated ${payloads.length} webhook payload(s)`, 'WebhookManager')

    return payloads
  }

  // --- Basic processing ---

  /**
   * Handle an incoming webhook:
   * - Verifies signature (if secret configured)
   * - Validates the payload
   * - Emits 'batch' event if multiple payloads
   * - Emits individual events for each payload
   * - Emits wildcard '*' event for each payload
   * @param rawBody Incoming webhook raw body (Buffer|string) or already-parsed object
   * @param signature Optional signature for verification
   * @returns true if at least one event was emitted
   */
  async handleWebhook(rawBody: unknown, signature?: string): Promise<boolean> {
    this._logger.info('Handling incoming webhook', 'WebhookManager')
    let emitted = false

    try {
      const payloads = this.parseWebhook(rawBody, signature)

      // Emit batch event once with all payloads
      if (this._emitter.emit('batch', payloads)) {
        this._logger.debug('Batch event emitted', 'WebhookManager')
        emitted = true
      }

      // Emit each individual action and '*' wildcard events
      for (const payload of payloads) {
        if (this._emitter.emit(payload.action, payload)) {
          this._logger.debug(`Event emitted for action: ${payload.action}`, 'WebhookManager')
          emitted = true
        }
        if (this._emitter.emit('*', payload)) {
          this._logger.debug(`Wildcard '*' event emitted for action: ${payload.action}`, 'WebhookManager')
          emitted = true
        }
      }

      this._logger.info(`Webhook processing completed, emitted=${emitted}`, 'WebhookManager')
    } catch (err) {
      this._logger.error('Error handling webhook', err, 'WebhookManager')
      if (err instanceof SdkError) throw err
      throw new WebhookValidationError(err)
    }

    return emitted
  }

  /**
   * Manually dispatch an event
   * @param event Event name (specific action, '*', or 'batch')
   * @param payload Payload to emit
   * @returns true if event had listeners
   */
  async dispatch<E extends keyof Omit<WebhookEventMap, '*' | 'batch'>>(
    event: E,
    payload: WebhookEventMap[E]
  ): Promise<boolean> {
    this._logger.debug(`Dispatching event: ${String(event)}`, 'WebhookManager')
    const result = await this._emitter.emitAsync(event, payload)
    this._logger.info(`Event dispatched: ${String(event)}, result=${result}`, 'WebhookManager')
    return result
  }
}
