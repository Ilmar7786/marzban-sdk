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
