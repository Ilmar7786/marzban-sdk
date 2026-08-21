import { ERROR_CODES } from '../codes'
import { SdkError } from '../sdk.error'

export class WebhookSignatureError extends SdkError {
  constructor(details?: unknown) {
    super(ERROR_CODES.WEBHOOK_SIGNATURE_ERROR, details)
  }
}

export class WebhookValidationError extends SdkError {
  constructor(details?: unknown) {
    super(ERROR_CODES.WEBHOOK_VALIDATION_ERROR, details)
  }
}

/**
 * Thrown when webhook signature verification is attempted in a browser.
 *
 * Webhooks are inherently server-to-server: verifying them requires the shared
 * secret, which must never be shipped to a browser client.
 */
export class WebhookEnvironmentError extends SdkError {
  constructor(details?: unknown) {
    super(ERROR_CODES.WEBHOOK_ENVIRONMENT_ERROR, details)
  }
}
