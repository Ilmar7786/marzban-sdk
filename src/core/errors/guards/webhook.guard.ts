import { WebhookSignatureError, WebhookValidationError } from '../categories'

export const isWebhookSignatureError = (error: unknown): error is WebhookSignatureError => {
  return error instanceof WebhookSignatureError
}

export const isWebhookValidationError = (error: unknown): error is WebhookValidationError => {
  return error instanceof WebhookValidationError
}
